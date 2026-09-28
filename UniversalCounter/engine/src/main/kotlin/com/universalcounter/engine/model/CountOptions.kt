package com.universalcounter.engine.model

import org.opencv.core.Rect

/**
 * Tunables for [com.universalcounter.engine.CountingEngine].
 *
 * The defaults are deliberately product-agnostic: the engine works from the
 * geometry present in the photo, not from a product category.
 */
data class CountOptions(
    /** Largest working-image edge, in pixels. Keeps the pipeline fast on-device. */
    val maxWorkingDimension: Int = 1280,

    /** Optional user/ROI crop in *original image* coordinates. */
    val roi: Rect? = null,

    /**
     * Largest number of objects the engine will ever report. Above this it
     * declares the picture unusable rather than emitting a huge number.
     */
    val maxObjects: Int = 400,

    /** Hard floor for object area, in working pixels. */
    val minAreaPx: Int = 40,

    /** Absolute ceiling for a single object area, in working pixels. */
    val maxAreaPx: Int = 1_400_000,

    /** Enable distance-transform watershed splitting of merged blobs. */
    val enableWatershed: Boolean = true,

    /** Enable convexity/erosion based splitting for concave merged blobs. */
    val enableConvexSplit: Boolean = true,

    /** Enable straight-line edge splitting of merged blobs. */
    val enableLineSplit: Boolean = true,

    /** Detect multiple visual object groups instead of silently combining them. */
    val detectGroups: Boolean = true,

    /**
     * If a merged blob's area is not close to an integer multiple of the
     * dominant single-object area, treat the split as unreliable.
     */
    val splitAmbiguityTolerance: Double = 0.35,

    /** When true, ambiguous merges make the whole count unreliable. */
    val refuseOnAmbiguousSeparation: Boolean = true
) {
    companion object {
        val DEFAULT = CountOptions()
    }
}
