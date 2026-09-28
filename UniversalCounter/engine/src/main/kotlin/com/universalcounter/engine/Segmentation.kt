package com.universalcounter.engine

import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

/** A binary foreground mask produced by one independent segmentation strategy. */
class StrategyMask(
    val name: String,
    val mask: Mat,
    /** The parameter that produced it, kept for explainability and stability tests. */
    val parameter: Double,
    /** True when [parameter] is a grey-level threshold, so it can be jittered. */
    val isThresholdBased: Boolean
) {
    fun foregroundRatio(): Double {
        val total = mask.total().toDouble()
        if (total <= 0) return 0.0
        return (Core.countNonZero(mask).toDouble() / total).coerceIn(0.0, 1.0)
    }
}

/**
 * Several *independent* ways to separate objects from background.
 *
 * No single threshold is trusted. Each strategy is run, scored on how well its
 * boundary follows real image gradients, and the result whose boundary best matches
 * the actual edges of the photo wins. Agreement between strategies later feeds the
 * count-quality score.
 */
object Segmentation {

    /**
     * Removes an uneven light gradient before thresholding, so a strategy does not
     * win merely because half the frame happens to be in shadow.
     *
     * Retinex-style division: estimate the illumination field with a large-kernel
     * close, then divide it out.
     */
    fun normalizeLighting(bgr: Mat): Mat {
        val gray = Mat()
        Imgproc.cvtColor(bgr, gray, Imgproc.COLOR_BGR2GRAY)
        val k = maxOf(15, (minOf(gray.rows(), gray.cols()) / 10) * 2 + 1)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(k.toDouble(), k.toDouble()))
        val illumination = Mat()
        Imgproc.morphologyEx(gray, illumination, Imgproc.MORPH_CLOSE, kernel)
        kernel.release()

        // Guard against a division by ~0 in a very dark corner.
        val floor = Mat()
        Core.max(illumination, Scalar(18.0), floor)

        val illum3 = Mat()
        Imgproc.cvtColor(floor, illum3, Imgproc.COLOR_GRAY2BGR)
        illum3.convertTo(illum3, CvType.CV_32FC3)
        val bgrF = Mat()
        bgr.convertTo(bgrF, CvType.CV_32FC3)
        val out = Mat()
        Core.divide(bgrF, illum3, out, 255.0)
        val result = Mat()
        out.convertTo(result, CvType.CV_8UC3)
        gray.release(); illumination.release(); floor.release()
        illum3.release(); bgrF.release(); out.release()

        // Restore full dynamic range after flattening the gradient.
        CvUtil.normalizeTo8U(result, result)
        return result
    }

    /** Remove specks and pinholes without destroying real object boundaries. */
    fun clean(mask: Mat, scaleHint: Int): Mat {
        val k = Segmentation.oddAtLeast((scaleHint / 200), 3)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(k.toDouble(), k.toDouble()))
        val opened = Mat()
        Imgproc.morphologyEx(mask, opened, Imgproc.MORPH_OPEN, kernel)
        val closed = Mat()
        Imgproc.morphologyEx(opened, closed, Imgproc.MORPH_CLOSE, kernel)
        opened.release(); kernel.release()
        // Drop specks by keeping only components that clear a size floor.
        val speckFloor = (scaleHint * scaleHint * 0.000012).toInt().coerceAtLeast(9)
        val kept = removeSmallComponents(closed, speckFloor)
        closed.release()
        return kept
    }

    /** Keeps only connected components of at least [minArea] pixels. */
    fun removeSmallComponents(mask: Mat, minArea: Int): Mat {
        val contours = CvUtil.externalContours(mask)
        val keep = ArrayList<org.opencv.core.MatOfPoint>()
        for (c in contours) {
            if (Imgproc.contourArea(c) >= minArea) keep.add(c) else c.release()
        }
        val out = Mat.zeros(mask.rows(), mask.cols(), CvType.CV_8UC1)
        if (keep.isNotEmpty()) CvUtil.fillContours(out, keep, 255.0)
        keep.forEach { it.release() }
        return out
    }

    /** Turns external contours into a solid mask, i.e. fills interior holes. */
    fun fillHoles(mask: Mat): Mat {
        val contours = CvUtil.externalContours(mask)
        val out = Mat.zeros(mask.rows(), mask.cols(), CvType.CV_8UC1)
        if (contours.isNotEmpty()) CvUtil.fillContours(out, contours, 255.0)
        contours.forEach { it.release() }
        return out
    }

    /**
     * How well a mask's boundary follows genuine image gradients, 0..1.
     *
     * A mask that invents structure scores low; a mask that traces real edges scores
     * high. This is the objective signal used to choose between strategies.
     */
    fun edgeAlignment(mask: Mat, gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val blurred = Mat()
        Imgproc.GaussianBlur(g, blurred, Size(5.0, 5.0), 0.0)
        val med = CvUtil.mean(blurred)
        blurred.release()

        val lower = (0.66 * med).coerceAtLeast(10.0)
        val upper = (1.33 * med).coerceAtLeast(40.0)
        val edges = Mat()
        Imgproc.Canny(g, edges, lower, upper, 3, true)
        g.release()

        val edgeDensity = Core.countNonZero(edges).toDouble() / maxOf(1.0, edges.total().toDouble())
        if (edgeDensity > 0.22) {
            // An edge map this dense carries no positional information.
            edges.release()
            return 0.0
        }

        val contours = CvUtil.externalContours(mask)
        if (contours.isEmpty()) {
            contours.forEach { it.release() }
            edges.release()
            return 0.0
        }

        // Dilate edges by 1 px so a boundary within a pixel still counts.
        val k = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        val edgeDilated = Mat()
        Imgproc.dilate(edges, edgeDilated, k)
        k.release()
        edges.release()

        var total = 0
        var matched = 0
        for (c in contours) {
            for (p in c.toArray()) {
                val x = p.x.toInt()
                val y = p.y.toInt()
                if (x < 0 || y < 0 || x >= mask.cols() || y >= mask.rows()) continue
                total++
                if (edgeDilated.get(y, x)[0] > 0) matched++
            }
        }
        contours.forEach { it.release() }
        edgeDilated.release()
        if (total == 0) return 0.0
        return (matched.toDouble() / total).coerceIn(0.0, 1.0)
    }

    /**
     * Builds every segmentation mask for the scene.
     *
     * @param bgr lighting-normalised working image
     * @param gray grayscale of that same image
     */
    fun buildAll(bgr: Mat, gray: Mat): List<StrategyMask> {
        val out = ArrayList<StrategyMask>()
        val scaleHint = minOf(bgr.rows(), bgr.cols())
        out.add(globalOtsu(gray, scaleHint))
        adaptiveGaussian(gray, scaleHint)?.let { out.add(it) }
        adaptiveMean(gray, scaleHint)?.let { out.add(it) }
        bestChannelThreshold(bgr, scaleHint)?.let { out.add(it) }
        edgeBased(gray, scaleHint)?.let { out.add(it) }
        backgroundSubtraction(bgr, gray, scaleHint)?.let { out.add(it) }
        return out
    }

    /** Strategy 1: one global Otsu threshold. Best for evenly lit, contrasting scenes. */
    fun globalOtsu(gray: Mat, scaleHint: Int): StrategyMask {
        val bin = Mat()
        val t = Imgproc.threshold(gray, bin, 0.0, 255.0, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU)
        val cleaned = clean(bin, scaleHint)
        bin.release()
        return StrategyMask("GLOBAL_OTSU", cleaned, t, true)
    }

    /** Strategy 2: adaptive Gaussian threshold. Copes with shadowed corners. */
    fun adaptiveGaussian(gray: Mat, scaleHint: Int): StrategyMask? {
        val bin = Mat()
        val block = oddAtLeast(maxOf(15, scaleHint / 12), 3)
        val c = -(10.0 + 12.0 * (1.0 - sharpnessProxy(gray)))
        Imgproc.adaptiveThreshold(gray, bin, 255.0, Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C, Imgproc.THRESH_BINARY, block, c)
        val cleaned = clean(bin, scaleHint)
        bin.release()
        return StrategyMask("ADAPTIVE_GAUSSIAN", cleaned, c, true)
    }

    /** Strategy 3: adaptive mean threshold - a different local statistic. */
    fun adaptiveMean(gray: Mat, scaleHint: Int): StrategyMask? {
        val bin = Mat()
        val block = oddAtLeast(maxOf(15, scaleHint / 10), 3)
        Imgproc.adaptiveThreshold(gray, bin, 255.0, Imgproc.ADAPTIVE_THRESH_MEAN_C, Imgproc.THRESH_BINARY, block, 7.0)
        val cleaned = clean(bin, scaleHint)
        bin.release()
        return StrategyMask("ADAPTIVE_MEAN", cleaned, 7.0, true)
    }

    /**
     * Strategy 4: per-channel / HSV-style thresholding.
     *
     * Rather than assuming which colour space suits the product, the engine measures
     * Otsu separability in every colour channel plus H, S and V, and uses whichever
     * actually separates best.
     */
    fun bestChannelThreshold(bgr: Mat, scaleHint: Int): StrategyMask? {
        val hsv = Mat()
        Imgproc.cvtColor(bgr, hsv, Imgproc.COLOR_BGR2HSV)

        val bgrCh = ArrayList<Mat>()
        Core.split(bgr, bgrCh)
        val hsvCh = ArrayList<Mat>()
        Core.split(hsv, hsvCh)
        val all = ArrayList<Mat>()
        all.addAll(bgrCh)
        all.addAll(hsvCh)
        val names = listOf("BLUE", "GREEN", "RED", "HUE", "SATURATION", "VALUE")

        var bestIdx = -1
        var bestSep = -1.0
        for (i in all.indices) {
            val c8 = CvUtil.asGray8u(all[i])
            val sep = CvUtil.otsuSeparability(c8).first
            c8.release()
            if (sep > bestSep) {
                bestSep = sep
                bestIdx = i
            }
        }
        hsv.release()
        if (bestIdx < 0 || bestSep <= 0.0) {
            all.forEach { it.release() }
            return null
        }

        val ch8 = CvUtil.asGray8u(all[bestIdx])
        val bin = Mat()
        val t = Imgproc.threshold(ch8, bin, 0.0, 255.0, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU)
        ch8.release()
        all.forEach { it.release() }

        val cleaned = clean(bin, scaleHint)
        bin.release()
        // Objects are the smaller class; pick the polarity accordingly.
        val mask = Mat()
        if (Core.countNonZero(cleaned).toDouble() > cleaned.total() / 2.0) {
            Core.bitwise_not(cleaned, mask)
        } else {
            cleaned.copyTo(mask)
        }
        cleaned.release()
        return StrategyMask("CHANNEL_${names[bestIdx]}", mask, t, true)
    }

    /**
     * Strategy 5: edge-based segmentation. Closes Canny edges into outlines and fills
     * them, which helps when objects and background have similar brightness but a
     * clear boundary.
     */
    fun edgeBased(gray: Mat, scaleHint: Int): StrategyMask? {
        val g = CvUtil.asGray8u(gray)
        val blurred = Mat()
        Imgproc.GaussianBlur(g, blurred, Size(5.0, 5.0), 0.0)
        val med = CvUtil.mean(blurred)
        blurred.release()
        val lower = (0.66 * med).coerceAtLeast(10.0)
        val upper = (1.33 * med).coerceAtLeast(40.0)
        val edges = Mat()
        Imgproc.Canny(g, edges, lower, upper)
        g.release()

        val kSize = oddAtLeast(maxOf(3, scaleHint / 90), 3)
        val k = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(kSize.toDouble(), kSize.toDouble()))
        val closed = Mat()
        Imgproc.morphologyEx(edges, closed, Imgproc.MORPH_CLOSE, k)
        k.release()
        edges.release()

        val filled = fillHoles(closed)
        closed.release()
        if (Core.countNonZero(filled).toDouble() / maxOf(1.0, filled.total().toDouble()) > 0.85) {
            filled.release()
            return null // the "closed edges" covered the whole frame: useless
        }
        return StrategyMask("EDGE_BASED", filled, upper, false)
    }

    /**
     * Strategy 6: background subtraction against a model built from the frame border.
     *
     * Products are normally laid on a surface whose colour is visible around the
     * edges of the picture, so the border pixels make a cheap, deterministic
     * background model.
     */
    fun backgroundSubtraction(bgr: Mat, gray: Mat, scaleHint: Int): StrategyMask? {
        val band = (minOf(gray.rows(), gray.cols()) * 0.06).toInt().coerceAtLeast(3)
        val model = borderMedianModel(gray, band) ?: return null
        val diff = Mat()
        Core.absdiff(gray, model, diff)
        model.release()

        val bin = Mat()
        val t = Imgproc.threshold(diff, bin, 0.0, 255.0, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU)
        val cleaned = clean(bin, scaleHint)
        bin.release(); diff.release()
        if (Core.countNonZero(cleaned) == 0) {
            cleaned.release()
            return null
        }
        return StrategyMask("BACKGROUND_SUBTRACTION", cleaned, t, true)
    }

    /** Median grey level of the left and right border strips, per row. */
    private fun borderMedianModel(gray: Mat, band: Int): Mat? {
        val rows = gray.rows()
        val cols = gray.cols()
        if (rows < 12 || cols < 12) return null
        val w = minOf(band, cols / 3)
        if (w < 2) return null

        val left = Mat(rows, w, CvType.CV_8UC1)
        val right = Mat(rows, w, CvType.CV_8UC1)
        for (y in 0 until rows) {
            for (x in 0 until w) {
                left.put(y, x, gray.get(y, x)[0])
                right.put(y, x, gray.get(y, cols - 1 - x)[0])
            }
        }
        // Median of the combined border samples for each row.
        val model = Mat(rows, cols, CvType.CV_8UC1)
        for (y in 0 until rows) {
            val samples = ArrayList<Int>(2 * w)
            for (x in 0 until w) {
                samples.add(left.get(y, x)[0].toInt())
                samples.add(right.get(y, x)[0].toInt())
            }
            samples.sort()
            val med = samples[samples.size / 2]
            model.row(y).setTo(Scalar(med.toDouble()))
        }
        left.release(); right.release()

        // Smooth horizontally so the model has no per-row banding.
        val k = (w * 4 + 1).coerceAtLeast(5)
        val smoothed = Mat()
        Imgproc.GaussianBlur(model, smoothed, Size(k.toDouble(), k.toDouble()), 0.0)
        model.release()
        return smoothed
    }

    private fun sharpnessProxy(gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val lap = Mat()
        Imgproc.Laplacian(g, lap, CvType.CV_64F)
        val (mu, sigma) = CvUtil.meanStd(lap)
        lap.release(); g.release()
        val v = (sigma * sigma).coerceAtLeast(0.0)
        return (kotlin.math.ln(v + 1.0) / kotlin.math.ln(2000.0)).coerceIn(0.0, 1.0)
    }

    fun oddAtLeast(v: Int, min: Int): Int {
        var x = maxOf(v, min)
        if (x % 2 == 0) x += 1
        return x
    }
}
