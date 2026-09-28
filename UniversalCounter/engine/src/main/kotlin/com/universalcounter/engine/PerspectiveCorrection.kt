package com.universalcounter.engine

import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot

/** Result of trying to flatten the shooting surface. */
class Rectified(
    val image: Mat,
    val applied: Boolean,
    /** Human-readable note about what happened, shown in the explain panel. */
    val note: String,
    /** 0..1, how sure we are the quad really is the ground plane. */
    val confidence: Double
)

/**
 * Perspective correction for photographs taken at an angle.
 *
 * The surface the goods are stacked on - a floor, a table, a sheet of plywood - is
 * usually the largest quadrilateral in the frame. Finding it and warping it to a
 * rectangle removes the keystone distortion that would otherwise make identical
 * objects look like different sizes depending on where they sit.
 *
 * The warp is only applied when the quad is convincingly a large, convex, roughly
 * rectangular region. A wrong warp is far worse than none, so the default is to do
 * nothing and say so.
 */
object PerspectiveCorrection {

    fun rectify(bgr: Mat): Rectified {
        val h = bgr.rows()
        val w = bgr.cols()
        val imageArea = (h * w).toDouble()
        if (imageArea <= 0) return Rectified(bgr, false, "Empty image", 0.0)

        val gray = Mat()
        Imgproc.cvtColor(bgr, gray, Imgproc.COLOR_BGR2GRAY)
        val blurred = Mat()
        Imgproc.GaussianBlur(gray, blurred, org.opencv.core.Size(5.0, 5.0), 0.0)
        val med = CvUtil.mean(blurred)
        blurred.release()
        val edges = Mat()
        Imgproc.Canny(
            gray, edges,
            (0.66 * med).coerceAtLeast(10.0),
            (1.33 * med).coerceAtLeast(40.0)
        )
        edges.convertTo(edges, CvType.CV_8UC1)
        // Close small gaps so a surface boundary reads as one long contour.
        val k = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, org.opencv.core.Size(9.0, 9.0))
        val closed = Mat()
        Imgproc.morphologyEx(edges, closed, Imgproc.MORPH_CLOSE, k)
        k.release()

        val contours = CvUtil.externalContours(closed)
        var best: MatOfPoint2f? = null
        var bestScore = 0.0
        for (c in contours) {
            val peri = CvUtil.arcLengthOf(c)
            if (peri < 0.25 * maxOf(w, h)) continue
            // approxPolyDP works on the float point type.
            val cF = MatOfPoint2f(*c.toArray())
            val approx = MatOfPoint2f()
            Imgproc.approxPolyDP(cF, approx, 0.02 * peri, true)
            cF.release()
            if (approx.total() == 4L) {
                val approxP = MatOfPoint(*approx.toArray())
                val area = Imgproc.contourArea(approxP)
                val convex = Imgproc.isContourConvex(approxP)
                approxP.release()
                // Prefer a large, convex quad; a concave one is not a surface.
                val score = if (convex) area / imageArea else area / imageArea * 0.3
                if (score > bestScore) {
                    bestScore = score
                    best?.release()
                    best = approx
                } else approx.release()
            } else approx.release()
        }
        contours.forEach { it.release() }
        closed.release(); edges.release(); gray.release()

        // Only warp a quad that covers a substantial part of the frame.
        if (best == null || bestScore < 0.30) {
            best?.release()
            return Rectified(bgr, false, "No confident shooting surface found; image used as captured", 0.0)
        }

        val corners = orderCorners(best.toArray())
        val (tl, tr, br, bl) = corners
        best.release()

        val quad = PerspectiveCorrection.Quad(tl, tr, br, bl)
        val outW = quad.widthTop.toInt().coerceIn(16, 4096)
        val outH = quad.heightLeft.toInt().coerceIn(16, 4096)

        val src = MatOfPoint2f(tl, tr, br, bl)
        val dst = MatOfPoint2f(
            Point(0.0, 0.0),
            Point(outW - 1.0, 0.0),
            Point(outW - 1.0, outH - 1.0),
            Point(0.0, outH - 1.0)
        )
        val m = Imgproc.getPerspectiveTransform(src, dst)
        val out = Mat()
        Imgproc.warpPerspective(bgr, out, m, org.opencv.core.Size(outW.toDouble(), outH.toDouble()))
        src.release(); dst.release(); m.release()

        val confidence = (bestScore / 0.6).coerceIn(0.0, 1.0)
        return Rectified(
            image = out,
            applied = true,
            note = "Perspective corrected to a flat ${outW}x$outH surface (confidence ${"%.2f".format(confidence)})",
            confidence = confidence
        )
    }

    /**
     * Orders four points as top-left, top-right, bottom-right, bottom-left by
     * summing and differencing their coordinates - the standard robust method.
     */
    fun orderCorners(pts: Array<Point>): Quad {
        var tl = pts[0]; var tr = pts[0]; var br = pts[0]; var bl = pts[0]
        var sumMin = Double.MAX_VALUE
        var sumMax = -Double.MAX_VALUE
        var diffMin = Double.MAX_VALUE
        var diffMax = -Double.MAX_VALUE
        for (p in pts) {
            val s = p.x + p.y
            val d = p.x - p.y
            if (s < sumMin) { sumMin = s; tl = p }
            if (s > sumMax) { sumMax = s; br = p }
            if (d < diffMin) { diffMin = d; tr = p }
            if (d > diffMax) { diffMax = d; bl = p }
        }
        return Quad(tl, tr, br, bl)
    }

    data class Quad(val tl: Point, val tr: Point, val br: Point, val bl: Point) {
        val widthTop: Double get() = hypot(tr.x - tl.x, tr.y - tl.y)
        val widthBottom: Double get() = hypot(br.x - bl.x, br.y - bl.y)
        val heightLeft: Double get() = hypot(bl.x - tl.x, bl.y - tl.y)
        val heightRight: Double get() = hypot(br.x - tr.x, br.y - tr.y)

        /** How close the quad is to a true rectangle, 0..1. */
        val rectangularity: Double
            get() {
                val horizontal = (widthTop + widthBottom) / 2.0
                val vertical = (heightLeft + heightRight) / 2.0
                if (horizontal <= 0 || vertical <= 0) return 0.0
                val hDev = abs(widthTop - widthBottom) / horizontal
                val vDev = abs(heightLeft - heightRight) / vertical
                return (1.0 - (hDev + vDev)).coerceIn(0.0, 1.0)
            }
    }
}
