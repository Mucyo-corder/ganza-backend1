package com.universalcounter.engine

import com.universalcounter.engine.model.CountOptions
import com.universalcounter.engine.model.DetectedObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.abs
import kotlin.math.sqrt

/** Outcome of trying to separate one merged blob. */
class SplitAttempt(
    val pieces: List<MatOfPoint>,
    /** 0..1, how well the piece areas agree with the expected single-object area. */
    val confidence: Double,
    val method: String,
    val ambiguous: Boolean
) {
    fun release() = pieces.forEach { it.release() }
}

/**
 * Separating objects that touch in the photograph.
 *
 * The guiding rule is that the engine must never *invent* a count. So every split
 * is validated against the size of an object the engine can already see
 * independently; a split is only accepted when the resulting pieces actually look
 * like real objects. When it cannot tell, it says so instead of guessing.
 */
object ObjectSeparation {

    /**
     * @param blob isolated merged region, 1 = foreground
     * @param bgr colour image, needed by watershed
     * @param expectedAreaPx area of one real object, or 0 when unknown
     */
    fun split(
        blob: Mat,
        bgr: Mat,
        expectedAreaPx: Double,
        options: CountOptions
    ): SplitAttempt {
        val anyEnabled = options.enableWatershed || options.enableConvexSplit || options.enableLineSplit
        if (!anyEnabled) return SplitAttempt(emptyList(), 0.0, "none", true)

        val candidates = ArrayList<SplitAttempt>()
        try {
            if (options.enableWatershed) {
                for (frac in doubleArrayOf(0.18, 0.26, 0.34, 0.42, 0.50)) {
                    watershedSplit(blob, bgr, frac)?.let { candidates.add(it) }
                }
            }
            if (options.enableConvexSplit) erosionSplit(blob)?.let { candidates.add(it) }
            if (options.enableLineSplit) lineSplit(blob, bgr)?.let { candidates.add(it) }
        } catch (_: Throwable) {
            // A failed split is simply "no information", never a crash.
        }

        if (candidates.isEmpty()) return SplitAttempt(emptyList(), 0.0, "none", true)

        if (expectedAreaPx <= 0.0) {
            // With no independently-seen object to compare against, there is
            // nothing to validate the split with. Report the reading, but as
            // untrusted rather than as a fact.
            val best = candidates.maxByOrNull { it.pieces.size }!!
            candidates.filter { it !== best }.forEach { it.release() }
            return SplitAttempt(best.pieces, 0.0, best.method, true)
        }

        val scored = candidates.map { it to pieceAgreement(it.pieces, expectedAreaPx) }
        val (best, agreement) = scored.maxByOrNull { it.second }!!
        candidates.filter { it !== best }.forEach { it.release() }
        return SplitAttempt(
            pieces = best.pieces,
            confidence = agreement,
            method = best.method,
            ambiguous = agreement < options.splitAmbiguityTolerance
        )
    }

    /**
     * 1.0 when every piece is exactly one whole object.
     *
     * Splitting a 3-object blob into 2 pieces therefore scores poorly, which is
     * exactly the behaviour we want: the engine then refuses instead of guessing.
     */
    fun pieceAgreement(pieces: List<MatOfPoint>, expectedAreaPx: Double): Double {
        if (pieces.isEmpty()) return 0.0
        val areas = pieces.map { Imgproc.contourArea(it) }.filter { it > 0 }
        if (areas.isEmpty() || expectedAreaPx <= 0) return 0.0
        val n = areas.size
        val actualTotal = areas.sum()
        val expectedTotal = expectedAreaPx * n
        if (actualTotal <= 0) return 0.0

        // (1) Does the blob's total area look like n whole objects?
        val totalScore = 1.0 - (abs(actualTotal - expectedTotal) / expectedTotal).coerceIn(0.0, 1.0)

        // (2) Do the individual pieces look like whole objects?
        val expectedPiece = actualTotal / n
        val pieceScore = Stats.mean(
            areas.map { 1.0 - (abs(it - expectedPiece) / expectedPiece).coerceIn(0.0, 1.0) }
        )
        return (totalScore * 0.4 + pieceScore * 0.6).coerceIn(0.0, 1.0)
    }

    /**
     * Distance-transform + watershed. The distance transform peaks at the centre of
     * each individual object, so local maxima of it are good split markers even
     * where two objects share a boundary.
     */
    fun watershedSplit(blob: Mat, bgr: Mat, markerFraction: Double): SplitAttempt? {
        val bin = asBinary8u(blob)
        if (Core.countNonZero(bin) == 0) {
            bin.release()
            return null
        }

        val dist = Mat()
        Imgproc.distanceTransform(bin, dist, Imgproc.DIST_L2, 5)
        val maxDist = Core.minMaxLoc(dist).maxVal
        if (maxDist <= 1.0) {
            bin.release(); dist.release()
            return null
        }

        val cut = maxDist * markerFraction
        val cores = Mat()
        Imgproc.threshold(dist, cores, cut, 255.0, Imgproc.THRESH_BINARY)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        // Merge cores that belong to the same object.
        Imgproc.morphologyEx(cores, cores, Imgproc.MORPH_CLOSE, kernel)

        val labels = Mat()
        val n = Imgproc.connectedComponentsWithAlgorithm(
            cores, labels, 8, CvType.CV_32S, Imgproc.CCL_GRANA
        )
        cores.release()
        if (n <= 2) {
            bin.release(); dist.release(); labels.release(); kernel.release()
            return null
        }

        val colour = if (bgr.size() == bin.size() && bgr.type() == CvType.CV_8UC3) {
            bgr.clone()
        } else {
            Mat().also { Imgproc.cvtColor(bin, it, Imgproc.COLOR_GRAY2BGR) }
        }
        // Watershed writes -1 onto the separating boundary it finds.
        Imgproc.watershed(colour, labels)
        colour.release()
        bin.release(); dist.release(); kernel.release()

        val pieces = ArrayList<MatOfPoint>()
        for (label in 1 until n) {
            val pieceMask = Mat()
            CvUtil.compareEq(labels, label.toDouble(), pieceMask)
            val k = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
            Imgproc.morphologyEx(pieceMask, pieceMask, Imgproc.MORPH_CLOSE, k)
            k.release()
            largestContour(pieceMask)?.let { pieces.add(it) }
            pieceMask.release()
        }
        if (pieces.size <= 1) {
            pieces.forEach { it.release() }
            return null
        }
        return SplitAttempt(pieces, 0.0, "WATERSHED(f=$markerFraction)", false)
    }

    /**
     * Erode until the blob falls apart, then grow the parts back. Effective when
     * objects touch over a small contact area, which is the common case for
     * stacked blocks and cartons.
     */
    fun erosionSplit(blob: Mat): SplitAttempt? {
        val base = asBinary8u(blob)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(3.0, 3.0))
        var current = Mat()
        base.copyTo(current)

        var iterations = 0
        var bestParts: List<MatOfPoint> = emptyList()
        try {
            while (iterations < 40) {
                val eroded = Mat()
                Imgproc.erode(current, eroded, kernel)
                val parts = componentsOf(eroded)
                if (parts.size > 1) {
                    // Grow each seed back so the pieces tile the original blob
                    // with no gaps and no overlap.
                    val grown = regrowTo(parts, base, kernel)
                    parts.forEach { it.release() }
                    if (grown.size > 1) {
                        bestParts = grown
                    } else {
                        grown.forEach { it.release() }
                    }
                    eroded.release()
                    break
                }
                parts.forEach { it.release() }
                eroded.release()
                if (Core.countNonZero(current) < 6) break
                val next = Mat()
                current.copyTo(next)
                current.release()
                current = next
                iterations++
            }
        } finally {
            current.release()
            base.release()
            kernel.release()
        }
        if (bestParts.size <= 1) return null
        return SplitAttempt(bestParts, 0.0, "EROSION_SPLIT(iter=$iterations)", false)
    }

    /** Regrow seeds inside the blob until each one reaches its neighbours. */
    private fun regrowTo(parts: List<MatOfPoint>, base: Mat, kernel: Mat): List<MatOfPoint> {
        val size = base.size()
        val labelImage = Mat.zeros(size.height.toInt(), size.width.toInt(), CvType.CV_32S)
        parts.forEachIndexed { index, p ->
            val seed = Mat.zeros(size.height.toInt(), size.width.toInt(), CvType.CV_8UC1)
            Imgproc.drawContours(seed, listOf(p), -1, Scalar(255.0), -1)
            val seedS = Mat()
            seed.convertTo(seedS, CvType.CV_32S)
            // Label the seed region with (index + 1) so regions stay distinct.
            val tinted = Mat()
            CvUtil.multiplyScalar(seedS, (index + 1).toDouble(), tinted)
            Core.max(labelImage, tinted, labelImage)
            tinted.release(); seedS.release(); seed.release()
        }

        val out = ArrayList<MatOfPoint>()
        for (label in 1..parts.size) {
            var grown = Mat()
            CvUtil.compareEq(labelImage, label.toDouble(), grown)
            for (growStep in 0 until 16) {
                val next = Mat()
                Imgproc.dilate(grown, next, kernel)
                val limited = Mat()
                // Never grow outside the original object.
                Core.bitwise_and(next, base, limited)
                val diff = Mat()
                Core.absdiff(limited, grown, diff)
                val delta = Core.countNonZero(diff)
                next.release(); diff.release()
                grown.release()
                grown = limited
                if (delta == 0) break
            }
            largestContour(grown)?.let { out.add(it) }
            grown.release()
        }
        labelImage.release()
        return out
    }

    /**
     * Looks for a strong straight seam through a concave blob and cuts along it.
     * Catches side-by-side bricks and planks that share a long boundary but have
     * no meaningful waist for an erosion to exploit.
     */
    fun lineSplit(blob: Mat, bgr: Mat): SplitAttempt? {
        val base = asBinary8u(blob)
        val outer = largestContour(base)
        if (outer == null) {
            base.release()
            return null
        }

        val hullArea = CvUtil.convexHullArea(outer)
        val solidity = if (hullArea > 0) Imgproc.contourArea(outer) / hullArea else 1.0
        // Only a concave blob has an interior seam worth cutting.
        if (solidity > 0.93) {
            outer.release(); base.release()
            return null
        }

        val box = Imgproc.boundingRect(outer)
        val seam = findBestSeam(base, box)
        if (seam == null) {
            outer.release(); base.release()
            return null
        }

        val result = ArrayList<MatOfPoint>()
        try {
            val pieces = if (seam.x > 0) {
                val sx = seam.x.toInt()
                listOf(
                    Rect(0, 0, sx, base.rows()),
                    Rect(sx, 0, base.cols() - sx, base.rows())
                )
            } else {
                val sy = seam.y.toInt()
                listOf(
                    Rect(0, 0, base.cols(), sy),
                    Rect(0, sy, base.cols(), base.rows() - sy)
                )
            }
            for (r in pieces) {
                if (r.width <= 1 || r.height <= 1) continue
                // submat is a view onto `base`, so clone before contour finding.
                val piece = base.submat(r).clone()
                largestContour(piece)?.let { result.add(it) }
                piece.release()
            }
        } finally {
            outer.release()
            base.release()
        }
        if (result.size != 2) {
            result.forEach { it.release() }
            return null
        }
        return SplitAttempt(result, 0.0, "LINE_SPLIT", false)
    }

    /**
     * Finds the least-foreground cut through the blob that still passes near its
     * middle. That is the true seam between two touching objects.
     */
    private fun findBestSeam(blob: Mat, box: Rect): Point? {
        val h = box.height
        val w = box.width
        if (h < 8 || w < 8) return null

        var bestXScore = Double.MAX_VALUE
        var bestX = -1
        for (x in 1 until w) {
            val column = blob.submat(Rect(box.x + x, box.y, 1, h))
            val score = Core.mean(column).`val`[0]
            column.release()
            if (score < bestXScore) { bestXScore = score; bestX = box.x + x }
        }
        var bestYScore = Double.MAX_VALUE
        var bestY = -1
        for (y in 1 until h) {
            val row = blob.submat(Rect(box.x, box.y + y, w, 1))
            val score = Core.mean(row).`val`[0]
            row.release()
            if (score < bestYScore) { bestYScore = score; bestY = box.y + y }
        }

        // A seam has to run through the middle of the blob, otherwise it is just
        // shaving off an edge rather than dividing two objects.
        val relX = abs(bestX - box.x - w / 2.0) / (w / 2.0)
        val relY = abs(bestY - box.y - h / 2.0) / (h / 2.0)
        if (bestX > 0 && relX < 0.34) return Point(bestX.toDouble(), 0.0)
        if (bestY > 0 && relY < 0.34) return Point(0.0, bestY.toDouble())
        return null
    }

    /** Binary copy of a mask, never aliasing the caller's Mat. */
    private fun asBinary8u(src: Mat): Mat {
        val out = Mat()
        if (src.type() == CvType.CV_8UC1) src.copyTo(out) else src.convertTo(out, CvType.CV_8UC1)
        return out
    }

    private fun largestContour(mask: Mat): MatOfPoint? {
        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(mask, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
        hierarchy.release()
        var best: MatOfPoint? = null
        var bestArea = 0.0
        for (c in contours) {
            val a = Imgproc.contourArea(c)
            if (a > bestArea) {
                best?.release()
                best = c
                bestArea = a
            } else c.release()
        }
        return best
    }

    private fun componentsOf(mask: Mat): List<MatOfPoint> {
        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(mask, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
        hierarchy.release()
        return contours.filter { Imgproc.contourArea(it) > 0 }
    }

    /**
     * Smallest normalised gap between neighbouring objects, relative to the median
     * object size. Large means objects are well separated in the photo.
     */
    fun separationRatio(objects: List<DetectedObject>): Double {
        if (objects.size < 2) return 1.0
        val medianSide = Stats.median(objects.map { sqrt(it.areaPx) })
        if (medianSide <= 1e-6) return 0.0
        var minGap = Double.MAX_VALUE
        for (i in objects.indices) {
            for (j in i + 1 until objects.size) {
                val a = objects[i]
                val b = objects[j]
                val dx = a.centroid.x - b.centroid.x
                val dy = a.centroid.y - b.centroid.y
                if (sqrt(dx * dx + dy * dy) > medianSide * 6) continue
                val gap = Components.gapBetween(a, b)
                if (gap < minGap) minGap = gap
            }
        }
        if (minGap == Double.MAX_VALUE) return 1.0
        return (minGap / medianSide).coerceIn(0.0, 1.0)
    }
}
