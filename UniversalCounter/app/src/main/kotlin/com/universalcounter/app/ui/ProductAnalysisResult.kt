package com.universalcounter.app.ui

import com.universalcounter.engine.model.CountResult

private const val UNKNOWN_PRODUCT = "Unclassified item"
private const val UNKNOWN_CATEGORY = "General"

data class ProductAnalysisResult(
    val productName: String = UNKNOWN_PRODUCT,
    val category: String = UNKNOWN_CATEGORY,
    val quantity: Int = 0,
    val quality: String = "LOW",
    val detectionSummary: String = "I cannot determine this reliably from this photo.",
    val requiresConfirmation: Boolean = true,
    val quantityStatus: String = "COUNT_UNCERTAIN",
    val confidence: Double = 0.0,
    val characteristics: List<String> = emptyList(),
    val dimensions: String? = null,
    val userActionHint: String = "Please retake the photo with a clearer, single product group in frame."
) {
    fun safeQuantityLabel(): String = if (quantity > 0) quantity.toString() else "UNABLE TO COUNT RELIABLY"

    companion object {
        fun fromCountingResult(result: CountResult): ProductAnalysisResult {
            val qualityLabel = when (result.quality.tier) {
                com.universalcounter.engine.model.QualityTier.HIGH -> "HIGH"
                com.universalcounter.engine.model.QualityTier.MEDIUM -> "MEDIUM"
                com.universalcounter.engine.model.QualityTier.LOW -> "LOW"
                com.universalcounter.engine.model.QualityTier.UNRELIABLE -> "UNRELIABLE"
            }

            val count = result.count
            val reliable = result.isReliable && count > 0
            val calibration = result.calibration
            val dimensionsLabel = calibration?.displayLabel ?: "Physical dimensions cannot be verified from this photo."
            val summary = when {
                !reliable -> "I cannot determine this reliably from this photo. Please retake with better lighting and separate overlapping objects."
                count == 1 -> "One visually similar object detected. Exact product type remains uncertain; please confirm."
                else -> "Detected a group of visually similar objects. Exact product identity remains uncertain unless user confirms."
            }

            val status = when {
                !reliable -> "COUNT_UNCERTAIN"
                count == 1 -> "DETECTED"
                else -> "MULTIPLE_OBJECTS_DETECTED"
            }

            return ProductAnalysisResult(
                productName = if (reliable) "Likely product group" else UNKNOWN_PRODUCT,
                category = if (reliable) "General product" else UNKNOWN_CATEGORY,
                quantity = count,
                quality = qualityLabel,
                detectionSummary = summary,
                requiresConfirmation = !reliable || count == 0,
                quantityStatus = status,
                confidence = result.quality.score.coerceIn(0.0, 1.0),
                characteristics = listOf(
                    "Object count derived from local contour analysis",
                    "No product identity was invented from the photo",
                    "User confirmation required before saving"
                ),
                dimensions = dimensionsLabel,
                userActionHint = if (reliable) "Review the object count and product type before saving." else "Please retake the photo closer, improve lighting, and keep items separated."
            )
        }
    }
}
