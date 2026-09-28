package com.universalcounter.engine

import com.universalcounter.engine.model.QualityFactors
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.ln

/**
 * Deterministic image statistics.
 *
 * Nothing here uses a learned model - these are closed-form measures of the actual
 * pixels, so every number the app shows about photo quality is reproducible and
 * explainable.
 */
object ImageQuality {

    /** Variance of the Laplacian: the standard focus/blur measure. */
    fun laplacianVariance(gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val lap = Mat()
        Imgproc.Laplacian(g, lap, CvType.CV_64F, 3, 1.0, 0.0, Core.BORDER_DEFAULT)
        val (mu, sigma) = CvUtil.meanStd(lap)
        lap.release(); g.release()
        return (sigma * sigma).coerceAtLeast(0.0)
    }

    /**
     * Maps raw Laplacian variance onto 0..1 on a log scale, because the useful range
     * of that measure spans several orders of magnitude.
     */
    fun sharpnessScore(gray: Mat): Double {
        val v = laplacianVariance(gray)
        val lo = ln(25.0)
        val hi = ln(3000.0)
        return ((ln(v + 1.0) - lo) / (hi - lo)).coerceIn(0.0, 1.0)
    }

    /** Fraction of pixels crushed to black or blown to white. */
    fun clippedPixelRatio(gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val hist = CvUtil.histogram256(g)
        g.release()
        val total = hist.sum().toDouble()
        if (total <= 0) return 1.0
        var clipped = 0.0
        for (i in 0..2) clipped += hist[i]
        for (i in 253..255) clipped += hist[i]
        return (clipped / total).coerceIn(0.0, 1.0)
    }

    /**
     * 1.0 means the illumination is perfectly even across the frame.
     *
     * The illumination field is estimated with a large-kernel morphological close -
     * the classic way to model a slowly varying light gradient while ignoring the
     * objects sitting on top of it.
     */
    fun lightingUniformity(gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val k = maxOf(9, (minOf(g.rows(), g.cols()) / 12) * 2 + 1)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(k.toDouble(), k.toDouble()))
        val illumination = Mat()
        Imgproc.morphologyEx(g, illumination, Imgproc.MORPH_CLOSE, kernel)
        kernel.release()
        val mean = CvUtil.mean(illumination)
        if (mean <= 1e-6) {
            illumination.release(); g.release()
            return 0.0
        }
        val illumStd = CvUtil.stdDev(illumination)
        illumination.release(); g.release()
        val cv = (illumStd / mean).coerceIn(0.0, 1.0)
        return (1.0 - cv * 4.0).coerceIn(0.0, 1.0)
    }

    /** Raw Otsu separability of the scene, 0..1. */
    fun otsuSeparability(gray: Mat): Double = CvUtil.otsuSeparability(gray).first

    fun otsuThreshold(gray: Mat): Int = CvUtil.otsuSeparability(gray).second

    /**
     * How strongly the objects stand out from the background, 0..1.
     *
     * Combines histogram separability with a balance term, because a histogram can
     * be perfectly separable yet put 95% of the image in one class - which is not a
     * usable "objects on a surface" picture.
     */
    fun backgroundContrast(gray: Mat): Double {
        val g = CvUtil.asGray8u(gray)
        val (sep, t) = CvUtil.otsuSeparability(g)
        if (sep <= 0.0) {
            g.release()
            return 0.0
        }
        val bin = Mat()
        Imgproc.threshold(g, bin, t.toDouble(), 255.0, Imgproc.THRESH_BINARY)
        val fg = Core.countNonZero(bin).toDouble()
        val total = g.total().toDouble()
        bin.release(); g.release()
        if (total <= 0) return 0.0
        val fgRatio = (fg / total).coerceIn(0.0, 1.0)
        // A good scene has the smaller class in a sane range, not 1% and not 99%.
        val balance = (1.0 - kotlin.math.abs(fgRatio - 0.35) / 0.65).coerceIn(0.0, 1.0)
        return (sep * 0.7 + balance * 0.3).coerceIn(0.0, 1.0)
    }

    /**
     * How stable a segmentation is under small perturbations of its threshold.
     *
     * A count that survives jittering reflects a real feature of the image; one that
     * jumps around was sitting on a knife edge of the threshold and is not trustworthy.
     *
     * @param countAt runs the same pipeline with a shifted threshold
     */
    fun thresholdStability(countAt: (Double) -> Int): Double {
        val base = countAt(0.0)
        if (base <= 0) return 0.0
        val counts = intArrayOf(-6, -3, 3, 6).map { countAt(it.toDouble()) }
        val spread = counts.max() - counts.min()
        val relSpread = spread.toDouble() / base
        return (1.0 - relSpread).coerceIn(0.0, 1.0)
    }

    /** Assembles the measured factors once every part of the pipeline has run. */
    fun factorsFrom(
        gray: Mat,
        borderTruncationRatio: Double,
        separationConfidence: Double,
        geometryConsistency: Double,
        strategyAgreement: Double,
        overlappingRatio: Double,
        minSeparationGapRatio: Double
    ): QualityFactors = QualityFactors(
        sharpness = sharpnessScore(gray),
        clippedPixelRatio = clippedPixelRatio(gray),
        lightingUniformity = lightingUniformity(gray),
        backgroundContrast = backgroundContrast(gray),
        borderTruncationRatio = borderTruncationRatio,
        separationConfidence = separationConfidence,
        geometryConsistency = geometryConsistency,
        strategyAgreement = strategyAgreement,
        overlappingRatio = overlappingRatio,
        minSeparationGapRatio = minSeparationGapRatio
    )
}
