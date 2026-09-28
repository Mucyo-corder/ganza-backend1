package com.universalcounter.engine

import com.universalcounter.engine.model.CountOptions
import com.universalcounter.engine.model.DetectedObject
import com.universalcounter.engine.model.FailureReason
import com.universalcounter.engine.model.ObjectGroup
import com.universalcounter.engine.model.QualityFactors
import com.universalcounter.engine.model.QualityReport
import com.universalcounter.engine.model.QualityTier
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Builds the deterministic COUNT QUALITY SCORE.
 *
 * This is explicitly *not* an ML confidence: no model is involved. It is a weighted
 * combination of closed-form image statistics, plus hard gates that can veto a
 * count outright so the app can say "unable to count reliably" instead of
 * returning a plausible-looking number.
 */
object QualityScorer {

    // Weights sum to 1.0. Chosen so the dominant drivers of a wrong count -
    // separation and contrast - dominate the score.
    private const val W_SHARPNESS = 0.13
    private const val W_CONTRAST = 0.20
    private const val W_LIGHTING = 0.07
    private const val W_SEPARATION = 0.20
    private const val W_GEOMETRY = 0.15
    private const val W_AGREEMENT = 0.13
    private const val W_EXPOSURE = 0.05
    private const val W_GAP = 0.07

    private const val TIER_HIGH = 0.70
    private const val TIER_MEDIUM = 0.54
    private const val TIER_LOW = 0.36

    /** Hard gates: below these, no count is issued at all. */
    private const val GATE_CONTRAST = 0.12
    private const val GATE_SHARPNESS = 0.14
    private const val GATE_CLIPPED = 0.55

    /**
     * @param ambiguousSplits number of merged blobs the engine could not split with confidence
     */
    fun score(
        objects: List<DetectedObject>,
        factors: QualityFactors,
        groups: List<ObjectGroup>,
        options: CountOptions,
        ambiguousSplits: Int
    ): QualityReport {
        val reasons = ArrayList<FailureReason>()
        val blocking = ArrayList<FailureReason>()

        val exposureScore = (1.0 - factors.clippedPixelRatio * 1.6).coerceIn(0.0, 1.0)
        // A visible gap between neighbours is direct evidence they are separate items.
        val gapScore = (factors.minSeparationGapRatio / 0.12).coerceIn(0.0, 1.0)
        val separationScore = (0.6 * factors.separationConfidence + 0.4 * gapScore).coerceIn(0.0, 1.0)

        val perFactor = linkedMapOf(
            "sharpness" to factors.sharpness,
            "backgroundContrast" to factors.backgroundContrast,
            "lightingUniformity" to factors.lightingUniformity,
            "separation" to separationScore,
            "geometryConsistency" to factors.geometryConsistency,
            "strategyAgreement" to factors.strategyAgreement,
            "exposure" to exposureScore,
            "objectGap" to gapScore
        )

        val score = W_SHARPNESS * factors.sharpness +
            W_CONTRAST * factors.backgroundContrast +
            W_LIGHTING * factors.lightingUniformity +
            W_SEPARATION * separationScore +
            W_GEOMETRY * factors.geometryConsistency +
            W_AGREEMENT * factors.strategyAgreement +
            W_EXPOSURE * exposureScore +
            W_GAP * gapScore

        // ---- hard gates -------------------------------------------------------
        if (objects.isEmpty()) blocking.add(FailureReason.NO_OBJECTS_DETECTED)
        if (factors.backgroundContrast < GATE_CONTRAST) blocking.add(FailureReason.LOW_CONTRAST)
        if (factors.sharpness < GATE_SHARPNESS) blocking.add(FailureReason.BLURRY_IMAGE)
        if (factors.clippedPixelRatio > GATE_CLIPPED) blocking.add(FailureReason.BAD_EXPOSURE)
        if (objects.size > options.maxObjects) blocking.add(FailureReason.TOO_MUCH_NOISE)
        if (options.refuseOnAmbiguousSeparation && ambiguousSplits > 0) {
            blocking.add(FailureReason.AMBIGUOUS_SEPARATION)
        }

        // ---- non-blocking concerns -------------------------------------------
        if (factors.clippedPixelRatio > 0.25) reasons.add(FailureReason.BAD_EXPOSURE)
        if (factors.sharpness < 0.30) reasons.add(FailureReason.BLURRY_IMAGE)
        if (factors.lightingUniformity < 0.45) reasons.add(FailureReason.UNEVEN_LIGHTING)
        if (factors.backgroundContrast < 0.30) reasons.add(FailureReason.LOW_CONTRAST)
        if (factors.borderTruncationRatio > 0.10) reasons.add(FailureReason.BORDER_TRUNCATION)
        if (factors.borderTruncationRatio > 0.45) reasons.add(FailureReason.OVERLAPPING_OBJECTS)
        if (factors.overlappingRatio > 0.25) reasons.add(FailureReason.OVERLAPPING_OBJECTS)
        if (factors.minSeparationGapRatio < 0.04) reasons.add(FailureReason.AMBIGUOUS_SEPARATION)
        if (factors.geometryConsistency < 0.45) reasons.add(FailureReason.INCONSISTENT_OBJECT_SIZE)
        if (factors.strategyAgreement < 0.55) reasons.add(FailureReason.STRATEGY_DISAGREEMENT)
        if (ambiguousSplits > 0) reasons.add(FailureReason.AMBIGUOUS_SEPARATION)
        if (groups.size > 1) reasons.add(FailureReason.MULTIPLE_GROUPS_AMBIGUOUS)

        val tier = if (blocking.isNotEmpty()) {
            QualityTier.UNRELIABLE
        } else if (score >= TIER_HIGH && factors.separationConfidence >= 0.45) {
            QualityTier.HIGH
        } else if (score >= TIER_MEDIUM) {
            QualityTier.MEDIUM
        } else if (score >= TIER_LOW) {
            QualityTier.LOW
        } else {
            QualityTier.LOW
        }

        val orderedReasons = (blocking + reasons).distinct()
        return QualityReport(
            tier = tier,
            score = score.coerceIn(0.0, 1.0),
            perFactor = perFactor,
            reasons = orderedReasons,
            blockingReasons = blocking.distinct(),
            measured = factors
        )
    }

    /**
     * Measures the blank gap between neighbouring objects and turns it into a 0..1
     * confidence that they are genuinely separate items rather than one merged blob.
     *
     * A gap of zero, or one that is a tiny fraction of the object size, means the
     * objects touch and the count is on shakier ground.
     */
    fun separationConfidence(objects: List<DetectedObject>): Double {
        if (objects.size < 2) return 1.0
        val gap = ObjectSeparation.separationRatio(objects)
        // 0.15 * medianSize is already a clearly visible gap.
        return (gap / 0.15).coerceIn(0.0, 1.0)
    }

    /** Fraction of objects that run into the edge of the frame. */
    fun borderTruncation(objects: List<DetectedObject>): Double {
        if (objects.isEmpty()) return 0.0
        return objects.count { it.touchesBorder }.toDouble() / objects.size
    }

    /**
     * How consistently shaped and sized the objects are, 0..1.
     *
     * Combines the spread of areas with the spread of elongations, because a scene
     * of identical bricks and a scene of mixed scrap should not score the same.
     */
    fun geometryConsistency(objects: List<DetectedObject>): Double {
        if (objects.isEmpty()) return 0.0
        if (objects.size == 1) return 0.6
        val areaScore = GroupClustering.sizeConsistency(objects)
        val elongScores = objects.map { ln(maxOf(1.0, it.elongation)) }
        val elongMode = Stats.modeOfLog(elongScores)
        val elongScore = Stats.consistencyScore(elongScores, elongMode)
        return (0.65 * areaScore + 0.35 * elongScore).coerceIn(0.0, 1.0)
    }

    /**
     * Agreement between the independent segmentation strategies, 0..1.
     *
     * When several methods that do not share a failure mode land on the same count,
     * the count is far more likely to be real. When they disagree, the engine lowers
     * its confidence or refuses entirely.
     */
    fun strategyAgreement(countsByStrategy: Map<String, Int>): Double {
        val counts = countsByStrategy.values.filter { it > 0 }
        if (counts.size < 2) return 0.5
        val median = Stats.median(counts.map { it.toDouble() })
        if (median <= 0) return 0.0
        // 1 - median absolute deviation of the log counts.
        val devs = counts.map { abs(ln(it.toDouble() / median)) }
        val mad = Stats.median(devs)
        return (1.0 - mad / 0.5).coerceIn(0.0, 1.0)
    }

    private fun ln(x: Double): Double = kotlin.math.ln(x)
}
