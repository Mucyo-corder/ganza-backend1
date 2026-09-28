package com.universalcounter.engine

import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfDouble
import org.opencv.core.MatOfFloat
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.RotatedRect
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * Thin wrappers over the parts of the OpenCV Java API whose signatures are
 * awkward (out-params, exact-type requirements, no scalar overloads).
 *
 * Centralising them keeps the pipeline code readable and avoids the classic
 * silent-failure traps such as aliasing a caller's Mat.
 */
object CvUtil {

    /** A fresh binary (0/255) copy. Never aliases the source. */
    fun asBinary8u(src: Mat): Mat {
        val out = Mat()
        if (src.type() == CvType.CV_8UC1) src.copyTo(out) else src.convertTo(out, CvType.CV_8UC1)
        return out
    }

    /** A fresh CV_8U single-channel copy. */
    fun asGray8u(src: Mat): Mat {
        val out = Mat()
        if (src.channels() == 1 && src.depth() == CvType.CV_8U) src.copyTo(out) else src.convertTo(out, CvType.CV_8UC1)
        return out
    }

    /** A single-value Mat of the requested size/type, used to emulate scalar overloads. */
    fun scalarMat(value: Double, rows: Int, cols: Int, type: Int = CvType.CV_32SC1): Mat =
        Mat(rows, cols, type, Scalar(value))

    /** `dst = (src == value) ? 255 : 0` */
    fun compareEq(src: Mat, value: Double, dst: Mat) {
        val s = scalarMat(value, src.rows(), src.cols(), CvType.CV_32SC1)
        val src32 = Mat()
        src.convertTo(src32, CvType.CV_32SC1)
        Core.compare(src32, s, dst, Core.CMP_EQ)
        src32.release()
        s.release()
    }

    /** `dst = src * factor` for a CV_8U source. */
    fun multiplyScalar(src: Mat, factor: Double, dst: Mat) {
        val f = scalarMat(factor, src.rows(), src.cols(), CvType.CV_32SC1)
        val src32 = Mat()
        src.convertTo(src32, CvType.CV_32SC1)
        Core.multiply(src32, f, dst)
        src32.release()
        f.release()
    }

    /** 256-bin histogram of an 8-bit single-channel image. */
    fun histogram256(gray: Mat): IntArray {
        val gray8 = asGray8u(gray)
        val hist = Mat()
        Imgproc.calcHist(
            listOf(gray8),
            MatOfInt(0),
            Mat(),
            hist,
            MatOfInt(256),
            MatOfFloat(0f, 256f)
        )
        val out = IntArray(256)
        for (i in 0 until 256) {
            val v = hist.get(i, 0)
            out[i] = if (v != null && v.isNotEmpty()) v[0].toInt() else 0
        }
        hist.release()
        gray8.release()
        return out
    }

    /**
     * Otsu's separability measure eta in 0..1: between-class variance divided by
     * total variance. 0 means the intensity histogram is a single blob, i.e. no
     * threshold can separate anything.
     */
    fun otsuSeparability(gray: Mat): Pair<Double, Int> {
        val gray8 = asGray8u(gray)
        val hist = histogram256(gray8)
        val total = hist.sum().toDouble()
        if (total <= 0.0) {
            gray8.release()
            return 0.0 to 0
        }

        var sumAll = 0.0
        for (i in 0 until 256) sumAll += i * hist[i]
        val meanAll = sumAll / total

        var sumB = 0.0
        var wB = 0.0
        var bestBetween = 0.0
        var bestT = 0
        for (t in 0 until 256) {
            wB += hist[t]
            if (wB == 0.0) continue
            val wF = total - wB
            if (wF == 0.0) break
            sumB += t * hist[t]
            val d = sumB / wB - (sumAll - sumB) / wF
            val between = wB * wF * d * d
            if (between > bestBetween) {
                bestBetween = between
                bestT = t
            }
        }

        // Total variance from the mean absolute deviation of the real pixels.
        val flat = scalarMat(meanAll, gray8.rows(), gray8.cols(), CvType.CV_8UC1)
        val diff = Mat()
        Core.absdiff(gray8, flat, diff)
        val mad = Core.mean(diff).`val`[0] * 1.2533
        diff.release(); flat.release(); gray8.release()

        val totalVariance = mad * mad
        if (totalVariance <= 1e-9) return 0.0 to bestT
        return ((bestBetween / total) / totalVariance).coerceIn(0.0, 1.0) to bestT
    }

    /** Perimeter of a contour, handling the MatOfPoint2f signature. */
    fun arcLengthOf(contour: MatOfPoint): Double {
        val f = MatOfPoint2f(*contour.toArray())
        val len = Imgproc.arcLength(f, true)
        f.release()
        return len
    }

    /** Minimum-area rotated rectangle of a contour. */
    fun minAreaRectOf(contour: MatOfPoint): RotatedRect {
        val f = MatOfPoint2f(*contour.toArray())
        val rr = Imgproc.minAreaRect(f)
        f.release()
        return rr
    }

    /** Convex-hull area, handling the MatOfInt signature. */
    fun convexHullArea(contour: MatOfPoint): Double {
        val hull = MatOfInt()
        Imgproc.convexHull(contour, hull, true)
        val pts = hull.toArray()
        val hullPoints = ArrayList<Point>(pts.size)
        val src = contour.toArray()
        for (i in pts) if (i in src.indices) hullPoints.add(src[i])
        hull.release()
        if (hullPoints.size < 3) return 0.0
        val hullMat = MatOfPoint(*hullPoints.toTypedArray())
        val area = Imgproc.contourArea(hullMat)
        hullMat.release()
        return area
    }

    /** External contours of a binary mask, largest first. */
    fun externalContours(mask: Mat): List<MatOfPoint> {
        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(mask, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_NONE)
        hierarchy.release()
        return contours.sortedByDescending { Imgproc.contourArea(it) }
    }

    /** The largest external contour, or null when the mask is empty. */
    fun largestContour(mask: Mat): MatOfPoint? {
        val all = externalContours(mask)
        if (all.isEmpty()) return null
        val best = all[0]
        all.drop(1).forEach { it.release() }
        return best
    }

    /** Paints contours as solid shapes. */
    fun fillContours(dst: Mat, contours: List<MatOfPoint>, value: Double) {
        Imgproc.drawContours(dst, contours, -1, Scalar(value), -1)
    }

    /** True when two axis-aligned rectangles overlap. */
    fun rectsIntersect(a: Rect, b: Rect): Boolean {
        return a.x < b.x + b.width && b.x < a.x + a.width &&
            a.y < b.y + b.height && b.y < a.y + a.height
    }

    /** Overlap of two rectangles, or null when they are disjoint. */
    fun rectIntersection(a: Rect, b: Rect): Rect? {
        if (!rectsIntersect(a, b)) return null
        val x = maxOf(a.x, b.x)
        val y = maxOf(a.y, b.y)
        val x2 = minOf(a.x + a.width, b.x + b.width)
        val y2 = minOf(a.y + a.height, b.y + b.height)
        return Rect(x, y, x2 - x, y2 - y)
    }

    /** Axis-aligned gap between two disjoint rectangles. */
    fun rectGap(a: Rect, b: Rect): Double {
        val dx = maxOf(0, maxOf(a.x - (b.x + b.width), b.x - (a.x + a.width)))
        val dy = maxOf(0, maxOf(a.y - (b.y + b.height), b.y - (a.y + a.height)))
        return kotlin.math.sqrt((dx * dx + dy * dy).toDouble())
    }

    /** Mean intensity of a single-channel image, or 0 when empty. */
    fun mean(m: Mat): Double = if (m.empty()) 0.0 else Core.mean(m).`val`[0]

    fun stdDev(m: Mat): Double {
        if (m.empty()) return 0.0
        val mean = Core.mean(m).`val`[0]
        val diff = Mat()
        val flat = scalarMat(mean, m.rows(), m.cols(), m.type())
        Core.absdiff(m, flat, diff)
        val mad = Core.mean(diff).`val`[0]
        diff.release()
        flat.release()
        return mad * 1.2533
    }

    /** Rescales to 0..255 without a Mat argument, which has no Java overload. */
    fun normalizeTo8U(src: Mat, dst: Mat) {
        Core.normalize(src, dst, 0.0, 255.0, Core.NORM_MINMAX, CvType.CV_8U)
    }

    fun meanStd(m: Mat): Pair<Double, Double> {
        if (m.empty()) return 0.0 to 0.0
        val mean = MatOfDouble()
        val sd = MatOfDouble()
        Core.meanStdDev(m, mean, sd)
        val mu = if (mean.empty()) 0.0 else mean.get(0, 0)[0]
        val sigma = if (sd.empty()) 0.0 else sd.get(0, 0)[0]
        mean.release(); sd.release()
        return mu to sigma
    }
}
