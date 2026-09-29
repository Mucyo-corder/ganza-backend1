package com.universalcounter.app.ui

import com.universalcounter.engine.ImageQuality
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.MatOfDouble
import org.opencv.imgproc.Imgproc

enum class PhotoQualityStatus {
    GOOD,
    ACCEPTABLE,
    NEEDS_REVIEW,
    INVALID
}

internal fun statusAfterAnalysisFailure(imageDecoded: Boolean): PhotoQualityStatus =
    if (imageDecoded) PhotoQualityStatus.NEEDS_REVIEW else PhotoQualityStatus.INVALID

data class PhotoQualityAssessment(
    val status: PhotoQualityStatus,
    val reason: String = ""
) {
    companion object {
        fun assess(image: Mat): PhotoQualityAssessment {
            if (image.empty() || image.cols() < 64 || image.rows() < 64 || image.channels() !in 1..4) {
                return PhotoQualityAssessment(PhotoQualityStatus.INVALID, "Image is empty, corrupted, or too small")
            }

            val gray = Mat()
            when (image.channels()) {
                1 -> image.copyTo(gray)
                4 -> Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGRA2GRAY)
                else -> Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY)
            }
            val mean = Core.mean(gray).`val`[0]
            val meanDeviation = MatOfDouble()
            val stddev = MatOfDouble()
            Core.meanStdDev(gray, meanDeviation, stddev)
            val contrast = stddev.toArray().firstOrNull() ?: 0.0
            val sharpness = ImageQuality.laplacianVariance(gray)
            gray.release()
            meanDeviation.release()
            stddev.release()

            if ((mean <= 2.0 || mean >= 253.0) && contrast <= 2.0) {
                return PhotoQualityAssessment(PhotoQualityStatus.INVALID, "Image is completely black or white")
            }
            if (sharpness < 0.15 && contrast < 2.0) {
                return PhotoQualityAssessment(PhotoQualityStatus.INVALID, "Image is extremely blurred with no visible detail")
            }

            val status = when {
                sharpness < 8.0 || contrast < 8.0 -> PhotoQualityStatus.NEEDS_REVIEW
                sharpness < 45.0 || contrast < 18.0 -> PhotoQualityStatus.ACCEPTABLE
                else -> PhotoQualityStatus.GOOD
            }
            val reason = if (status == PhotoQualityStatus.NEEDS_REVIEW) "Image detail or contrast is limited; review detected objects" else ""
            return PhotoQualityAssessment(status, reason)
        }
    }
}
