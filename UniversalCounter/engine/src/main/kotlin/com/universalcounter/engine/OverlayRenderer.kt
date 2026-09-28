package com.universalcounter.engine

import com.universalcounter.engine.model.DetectedObject
import com.universalcounter.engine.model.ObjectGroup
import com.universalcounter.engine.model.QualityTier
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * Draws the visual verification overlay.
 *
 * The user has to be able to see exactly what was counted, so every detected object
 * gets its own boundary and index number drawn on the photograph.
 */
object OverlayRenderer {

    /** Distinct, high-contrast colours cycled per object. */
    private val palette = arrayOf(
        Scalar(0.0, 220.0, 255.0),
        Scalar(255.0, 120.0, 0.0),
        Scalar(60.0, 255.0, 60.0),
        Scalar(255.0, 60.0, 255.0),
        Scalar(0.0, 255.0, 255.0),
        Scalar(255.0, 255.0, 0.0),
        Scalar(255.0, 80.0, 160.0),
        Scalar(80.0, 120.0, 255.0)
    )

    /**
     * Draws every object's contour, bounding box and index number.
     *
     * @param highlightIds objects the user has manually edited, drawn thicker
     */
    fun render(
        image: Mat,
        objects: List<DetectedObject>,
        groups: List<ObjectGroup>,
        tier: QualityTier,
        highlightIds: Set<Int> = emptySet()
    ): Mat {
        val out = image.clone()
        val thickness = maxOf(1, minOf(out.rows(), out.cols()) / 400)
        val fontScale = maxOf(0.32, minOf(out.rows(), out.cols()) / 1600.0)
        val multiGroup = groups.size > 1

        // Faint tint so the counted objects read as a set at a glance.
        if (objects.isNotEmpty()) {
            val tint = out.clone()
            tint.setTo(Scalar(0.0, 0.0, 0.0))
            Core.addWeighted(out, 0.65, tint, 0.35, 0.0, out)
            tint.release()
        }

        for ((index, o) in objects.withIndex()) {
            val base = palette[o.groupId % palette.size]
            val colour = if (o.cameFromSplit) {
                // Split pieces are marked differently, because those are the ones
                // the engine had to work hardest for.
                Scalar(0.0, 165.0, 255.0)
            } else base
            val lineWeight = if (o.id in highlightIds) thickness * 3 else thickness

            val contour = MatOfPoint(*o.contour.toTypedArray())
            Imgproc.polylines(out, listOf(contour), true, colour, lineWeight, Imgproc.LINE_AA)
            Imgproc.rectangle(
                out,
                Point(o.boundingBox.x.toDouble(), o.boundingBox.y.toDouble()),
                Point(
                    (o.boundingBox.x + o.boundingBox.width).toDouble(),
                    (o.boundingBox.y + o.boundingBox.height).toDouble()
                ),
                colour, maxOf(1, lineWeight - 1)
            )
            drawIndex(out, o, index, colour, fontScale, lineWeight, multiGroup, groups)
            contour.release()
        }

        drawBanner(out, objects, tier, multiGroup)
        return out
    }

    private fun drawIndex(
        img: Mat,
        o: DetectedObject,
        index: Int,
        colour: Scalar,
        fontScale: Double,
        thickness: Int,
        multiGroup: Boolean,
        groups: List<ObjectGroup>
    ) {
        val label = if (multiGroup) {
            val g = groups.getOrNull(o.groupId)
            "${g?.label ?: "?"}#${index + 1}"
        } else {
            "${index + 1}"
        }
        val org = Point(
            (o.boundingBox.x + o.boundingBox.width / 2.0 - 6.0).coerceAtLeast(2.0),
            (o.boundingBox.y + o.boundingBox.height / 2.0 + 5.0).coerceAtLeast(8.0)
        )
        // Dark backing plate so the number stays readable on any photo.
        val size = Imgproc.getTextSize(label, Imgproc.FONT_HERSHEY_SIMPLEX, fontScale, thickness, IntArray(1))
        Imgproc.rectangle(
            img,
            Point(org.x - 2.0, org.y - size.height - 3.0),
            Point(org.x + size.width + 2.0, org.y + 3.0),
            Scalar(0.0, 0.0, 0.0), -1
        )
        Imgproc.putText(
            img, label, org, Imgproc.FONT_HERSHEY_SIMPLEX, fontScale,
            Scalar(255.0, 255.0, 255.0), thickness + 1, Imgproc.LINE_AA
        )
    }

    /** A short status line at the top so the image itself states the verdict. */
    private fun drawBanner(img: Mat, objects: List<DetectedObject>, tier: QualityTier, multiGroup: Boolean) {
        val text = when (tier) {
            QualityTier.HIGH -> "Computer Vision Count: ${objects.size} objects (HIGH quality)"
            QualityTier.MEDIUM -> "Computer Vision Count: ${objects.size} objects (MEDIUM - please check)"
            QualityTier.LOW -> "Computer Vision Count: ${objects.size} objects (LOW - retake advised)"
            QualityTier.UNRELIABLE -> "COUNT NOT RELIABLE"
        }
        if (multiGroup) {
            // Group labels are drawn by the result screen; no extra banner text.
            return
        }
        val scale = maxOf(0.4, minOf(img.rows(), img.cols()) / 1100.0)
        val thickness = maxOf(1, minOf(img.rows(), img.cols()) / 350)
        val size = Imgproc.getTextSize(text, Imgproc.FONT_HERSHEY_SIMPLEX, scale, thickness, IntArray(1))
        val boxH = (size.height + 12).toInt()
        val region = img.submat(0, 0, boxH, minOf(img.cols(), (size.width + 20).toInt()))
        region.setTo(Scalar(0.0, 0.0, 0.0))
        Imgproc.putText(
            img, text, Point(10.0, size.height.toDouble() + 4.0),
            Imgproc.FONT_HERSHEY_SIMPLEX, scale, Scalar(255.0, 255.0, 255.0), thickness, Imgproc.LINE_AA
        )
    }
}
