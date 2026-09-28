package com.universalcounter.engine

import com.universalcounter.engine.model.CalibratedEstimate
import com.universalcounter.engine.model.DetectedObject
import org.opencv.core.Point
import kotlin.math.sqrt

/**
 * Turns pixel measurements into real-world dimensions - but only when the user has
 * supplied something of known size to measure against.
 *
 * Without a reference there is no scale in a photograph: a brick and a postage
 * stamp produce identical images from the same distance. The app therefore never
 * presents an uncalibrated size, and everything produced here is labelled
 * "CALIBRATED ESTIMATE" because a single reference cannot correct for perspective
 * or lens distortion.
 */
object Calibration {

    /**
     * @param referencePixelLength length of the user's reference object, measured in
     *        working-image pixels (e.g. the marked extent of a 10 cm card)
     * @param referenceRealLengthMm the real length of that object, in millimetres
     */
    fun calibrate(
        objects: List<DetectedObject>,
        referencePixelLength: Double,
        referenceRealLengthMm: Double,
        referenceName: String,
        knownObjectHeightMm: Double? = null
    ): CalibratedEstimate? {
        if (referencePixelLength <= 1.0 || referenceRealLengthMm <= 0.0) return null
        if (objects.isEmpty()) return null

        val mmPerPx = referenceRealLengthMm / referencePixelLength

        val lengths = objects.map { it.majorAxisPx * mmPerPx }
        val widths = objects.map { it.minorAxisPx * mmPerPx }
        val areas = objects.map { it.areaPx * mmPerPx * mmPerPx }

        val medianLength = Stats.median(lengths)
        val medianWidth = Stats.median(widths)
        val medianArea = Stats.median(areas)

        val height = knownObjectHeightMm
        val volume = if (height != null && height > 0) medianArea * height else null

        return CalibratedEstimate(
            millimetresPerPixel = mmPerPx,
            referenceName = referenceName,
            referenceRealLengthMm = referenceRealLengthMm,
            referencePixelLength = referencePixelLength,
            medianLengthMm = medianLength,
            medianWidthMm = medianWidth,
            medianAreaMm2 = medianArea,
            medianHeightMm = height,
            medianVolumeMm3 = volume
        )
    }

    /** Distance in pixels between two user-tapped points. */
    fun distanceBetween(a: Point, b: Point): Double =
        sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))

    fun formatMm(mm: Double?): String = if (mm == null) "not available" else String.format("%.1f mm", mm)

    fun formatMm2(mm2: Double?): String = if (mm2 == null) "not available" else String.format("%.0f mm2", mm2)

    fun formatMm3(mm3: Double?): String = if (mm3 == null) "not available" else String.format("%.0f mm3", mm3)
}
