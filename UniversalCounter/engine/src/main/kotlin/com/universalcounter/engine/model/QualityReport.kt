package com.universalcounter.engine.model

/**
 * How trustworthy the count is. This is a *deterministic* assessment computed from
 * measurable image statistics - it is not a machine-learning confidence output,
 * because no machine-learning model is involved in the counting path.
 */
enum class QualityTier {
    /** Objects clearly separated, image clean: automatic count is trustworthy. */
    HIGH,

    /** Usable count, but the user should eyeball the overlay before trusting it. */
    MEDIUM,

    /** Count is produced but is weakly supported: a retake is strongly advised. */
    LOW,

    /**
     * The engine refuses to state a count. Reasons are reported in
     * [QualityReport.reasons]; the UI must offer a retake instead of a number.
     */
    UNRELIABLE
}

/** Concrete, explainable reasons the engine can give for distrusting a count. */
enum class FailureReason(val userMessage: String) {
    NO_OBJECTS_DETECTED("No distinct objects were found in the photo"),
    LOW_CONTRAST("Background is too similar to the objects"),
    BLURRY_IMAGE("Image is blurry - hold the camera steady and move closer"),
    BAD_EXPOSURE("Image is over- or under-exposed"),
    UNEVEN_LIGHTING("Lighting is uneven across the scene"),
    OVERLAPPING_OBJECTS("Objects overlap and cannot be separated reliably"),
    BORDER_TRUNCATION("Objects are cut off by the edge of the frame"),
    INCONSISTENT_OBJECT_SIZE("Objects differ too much in size to be counted as one group"),
    AMBIGUOUS_SEPARATION("Touching objects could not be split unambiguously"),
    STRATEGY_DISAGREEMENT("Different segmentation methods disagreed on the count"),
    TOO_MUCH_NOISE("Too much background noise for a reliable count"),
    MULTIPLE_GROUPS_AMBIGUOUS("Several different object groups are present")
}

/** Raw, measurable image statistics. Every field is computed, never guessed. */
data class QualityFactors(
    /** Variance of the Laplacian, normalised to 0..1. Low means blurry. */
    val sharpness: Double,
    /** Fraction of pixels that are pure black or pure white. */
    val clippedPixelRatio: Double,
    /** 0..1, how evenly the scene is lit. */
    val lightingUniformity: Double,
    /** 0..1 separability between object pixels and background pixels. */
    val backgroundContrast: Double,
    /** Fraction of detected objects that touch the image border. */
    val borderTruncationRatio: Double,
    /** 0..1, how confidently touching objects were separated. */
    val separationConfidence: Double,
    /** 0..1, how similar the detected objects are to each other in size/shape. */
    val geometryConsistency: Double,
    /** 0..1, agreement between independent segmentation strategies. */
    val strategyAgreement: Double,
    /** Fraction of foreground area that sits in merged/crowded regions. */
    val overlappingRatio: Double,
    /** Smallest gap between neighbouring objects, relative to median object size. */
    val minSeparationGapRatio: Double
) {
    companion object {
        /** A neutral starting point before anything measurable exists yet. */
        val NEUTRAL = QualityFactors(
            sharpness = 0.5,
            clippedPixelRatio = 0.0,
            lightingUniformity = 0.5,
            backgroundContrast = 0.5,
            borderTruncationRatio = 0.0,
            separationConfidence = 0.5,
            geometryConsistency = 0.5,
            strategyAgreement = 0.5,
            overlappingRatio = 0.0,
            minSeparationGapRatio = 1.0
        )
    }
}

/**
 * The deterministic COUNT QUALITY SCORE.
 *
 * @param tier final verdict, derived from [score] and the hard gates.
 * @param perFactor the individual 0..1 factor scores that produced [score].
 * @param reasons why the engine is unhappy, phrased for a human.
 * @param blockingReasons subset of [reasons] severe enough to forbid a count.
 */
data class QualityReport(
    val tier: QualityTier,
    val score: Double,
    val perFactor: Map<String, Double>,
    val reasons: List<FailureReason>,
    val blockingReasons: List<FailureReason>,
    val measured: QualityFactors
) {
    val isCountable: Boolean get() = tier != QualityTier.UNRELIABLE

    /** A human-readable, auditable explanation of how the tier was reached. */
    fun explain(): String = buildString {
        appendLine("COUNT QUALITY SCORE (deterministic, no ML model used)")
        appendLine("  overall score : ${"%.3f".format(score)}  ->  $tier")
        appendLine("  factor scores :")
        perFactor.toSortedMap().forEach { (k, v) -> appendLine("      ${k.padEnd(22)} ${"%.3f".format(v)}") }
        appendLine("  measured image statistics :")
        appendLine("      sharpness                ${"%.4f".format(measured.sharpness)}")
        appendLine("      clipped pixel ratio      ${"%.4f".format(measured.clippedPixelRatio)}")
        appendLine("      lighting uniformity      ${"%.4f".format(measured.lightingUniformity)}")
        appendLine("      background contrast      ${"%.4f".format(measured.backgroundContrast)}")
        appendLine("      border truncation ratio  ${"%.4f".format(measured.borderTruncationRatio)}")
        appendLine("      overlapping area ratio   ${"%.4f".format(measured.overlappingRatio)}")
        appendLine("      min separation gap ratio ${"%.4f".format(measured.minSeparationGapRatio)}")
        if (reasons.isNotEmpty()) {
            appendLine("  concerns:")
            reasons.forEach { appendLine("      - ${it.name}: ${it.userMessage}") }
        }
        if (blockingReasons.isNotEmpty()) {
            appendLine("  count withheld because of: ${blockingReasons.joinToString { it.name }}")
        }
    }
}
