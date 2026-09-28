package com.universalcounter.engine.model

import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Rect

/**
 * One object the classical CV pipeline believes it found.
 *
 * Everything here is derived from the actual pixels of the captured photo: the
 * contour, the bounding box and the shape statistics all come from OpenCV.
 */
data class DetectedObject(
    val id: Int,
    /** Outer boundary of the object, in working-image pixel coordinates. */
    val contour: List<Point>,
    val boundingBox: Rect,
    val areaPx: Double,
    val perimeterPx: Double,
    val centroid: Point,
    /** Minimum-area rotated rectangle; the long side is the object's major axis. */
    val rotRect: RotatedBox,
    /** area / convexHullArea. 1.0 == perfectly convex, lower == concave. */
    val solidity: Double,
    /** area / minAreaRectArea. Low values mean a ragged or ring-like shape. */
    val rectangularity: Double,
    /** Circularity 4*pi*area/perimeter^2; 1.0 == circle. */
    val circularity: Double,
    /** Mean BGR of the object's pixels. */
    val meanColor: DoubleArray,
    /** True when the object runs into the image border (so it may be incomplete). */
    val touchesBorder: Boolean,
    /** Index of the visual group this object was clustered into. */
    val groupId: Int,
    /** True when this object was produced by splitting a merged blob. */
    val cameFromSplit: Boolean = false,
    /** How many merged blobs this object was carved out of (1 == not split). */
    val splitFactor: Int = 1
) {
    val widthPx: Int get() = boundingBox.width
    val heightPx: Int get() = boundingBox.height
    val majorAxisPx: Double get() = rotRect.longSide
    val minorAxisPx: Double get() = rotRect.shortSide
    val elongation: Double get() = if (rotRect.shortSide <= 0.0) 0.0 else rotRect.longSide / rotRect.shortSide

    /** Aspect ratio of the axis-aligned box, used for group clustering. */
    val boundingAspect: Double
        get() {
            val h = boundingBox.height.toDouble()
            return if (h <= 0.0) 1.0 else boundingBox.width.toDouble() / h
        }

    // DoubleArray needs structural equality handling for data-class semantics.
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DetectedObject) return false
        return id == other.id &&
            areaPx == other.areaPx &&
            boundingBox == other.boundingBox &&
            groupId == other.groupId &&
            cameFromSplit == other.cameFromSplit
    }

    override fun hashCode(): Int {
        var result = id
        result = 31 * result + areaPx.hashCode()
        result = 31 * result + boundingBox.hashCode()
        result = 31 * result + groupId
        result = 31 * result + cameFromSplit.hashCode()
        return result
    }
}

/** Axis-aligned-ish descriptor of a rotated minimum-area rectangle. */
data class RotatedBox(
    val center: Point,
    val width: Double,
    val height: Double,
    val angleDeg: Double
) {
    val longSide: Double get() = maxOf(width, height)
    val shortSide: Double get() = minOf(width, height)
    val area: Double get() = width * height
}

/**
 * A cluster of visually similar objects.
 *
 * Grouping is purely geometric/statistical (size, aspect, elongation, colour).
 * It is never a guess at a product name.
 */
data class ObjectGroup(
    val id: Int,
    val objects: List<DetectedObject>,
    val label: String,
    val medianAreaPx: Double,
    val medianAspect: Double,
    val medianElongation: Double
) {
    val size: Int get() = objects.size
}

/**
 * Approximate real-world dimensions derived from a user-supplied reference length.
 * Always presented as an estimate - never as a physically verified measurement.
 */
data class CalibratedEstimate(
    val millimetresPerPixel: Double,
    val referenceName: String,
    val referenceRealLengthMm: Double,
    val referencePixelLength: Double,
    val medianLengthMm: Double?,
    val medianWidthMm: Double?,
    val medianAreaMm2: Double?,
    /** Only filled when the user also provides a known object height. */
    val medianHeightMm: Double? = null,
    val medianVolumeMm3: Double? = null
) {
    val isPhysicalVerification: Boolean = false
    val displayLabel: String = "CALIBRATED ESTIMATE"
}

/** A full counting outcome for one photo. */
data class CountResult(
    val objects: List<DetectedObject>,
    val groups: List<ObjectGroup>,
    val quality: QualityReport,
    /** The image the coordinates refer to (downscaled working copy). */
    val workingImage: Mat,
    /** Overlay with every object boundary drawn. */
    val overlayImage: Mat,
    val strategyChosen: String,
    val strategyCandidates: List<StrategyOutcome>,
    /**
     * Step-by-step record of what the pipeline did and why, so any number in the
     * app can be traced back to the image measurements that produced it.
     */
    val pipelineTrace: String = "",
    val calibration: CalibratedEstimate? = null,
    /** Set when the user (not the algorithm) has adjusted the count. */
    val manuallyEdited: Boolean = false
) {
    val count: Int get() = objects.size
    val isReliable: Boolean get() = quality.isCountable
    val tier: QualityTier get() = quality.tier

    fun objectsInGroup(groupId: Int): List<DetectedObject> = objects.filter { it.groupId == groupId }
}

/** The result of running one particular segmentation strategy. */
data class StrategyOutcome(
    val name: String,
    val mask: Mat,
    val objectCount: Int,
    /** Deterministic 0..1 score describing how well this strategy explains the image. */
    val score: Double,
    val foregroundRatio: Double,
    val rawComponentCount: Int
) {
    override fun equals(other: Any?): Boolean =
        other is StrategyOutcome && name == other.name && objectCount == other.objectCount

    override fun hashCode(): Int = 31 * name.hashCode() + objectCount
}
