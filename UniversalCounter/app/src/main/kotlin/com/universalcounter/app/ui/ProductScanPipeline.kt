package com.universalcounter.app.ui

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private const val NOT_VERIFIED = "NOT VERIFIED"

data class ProductScanResult(
    val productName: String,
    val category: String,
    val brand: String,
    val model: String,
    val variant: String,
    val color: String,
    val material: String,
    val condition: String,
    val quantity: Int,
    val automaticCount: Int,
    val detectionQuality: String,
    val identificationStatus: String,
    val verificationStatus: String,
    val dimensions: String,
    val specificationSummary: String,
    val marketStatus: String,
    val priceMessage: String,
    val referencePrice: String,
    val currency: String = "RWF",
    val unitPrice: Double? = null,
    val sourceName: String? = null,
    val priceCheckedAt: String? = null,
    val totalValue: Double = 0.0,
    val imagePath: String? = null,
    val searchTerms: List<String> = emptyList()
)

object ProductScanPipeline {
    fun fallback(
        productName: String,
        quantity: Int,
        identificationStatus: String = "PARTIALLY_VERIFIED"
    ): ProductScanResult {
        val safeProductName = productName.ifBlank { "General product" }
        val safeIdentification = identificationStatus.ifBlank { "PARTIALLY_VERIFIED" }.uppercase(Locale.US)
        val safeQuantity = quantity.coerceAtLeast(0)
        val checkedAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

        return ProductScanResult(
            productName = safeProductName,
            category = "General",
            brand = NOT_VERIFIED,
            model = NOT_VERIFIED,
            variant = NOT_VERIFIED,
            color = NOT_VERIFIED,
            material = NOT_VERIFIED,
            condition = "Unknown",
            quantity = safeQuantity,
            automaticCount = safeQuantity,
            detectionQuality = if (safeQuantity > 0) "MEDIUM" else "LOW",
            identificationStatus = safeIdentification,
            verificationStatus = when {
                safeIdentification == "VERIFIED" -> "VERIFIED"
                safeQuantity > 0 -> "PARTIALLY_VERIFIED"
                else -> "NEEDS_REVIEW"
            },
            dimensions = "Dimensions: NOT VERIFIED",
            specificationSummary = "Product details and technical specifications remain unverified from the current image and available sources.",
            marketStatus = "CURRENT ONLINE PRICE: NOT AVAILABLE",
            priceMessage = "Current online pricing could not be checked because the internet/search source is not available in this build.",
            referencePrice = "NOT VERIFIED",
            currency = "RWF",
            unitPrice = null,
            sourceName = null,
            priceCheckedAt = checkedAt,
            totalValue = 0.0,
            imagePath = null,
            searchTerms = listOf(safeProductName, "Rwanda", "Kigali", "price")
        )
    }

    fun fromVisionAnalysis(
        imagePath: String?,
        detectedCount: Int,
        detectionQuality: String,
        productName: String = "General product",
        category: String = "General"
    ): ProductScanResult {
        val quality = detectionQuality.ifBlank { "LOW" }.uppercase(Locale.US)
        val quantity = detectedCount.coerceAtLeast(0)
        val identificationStatus = when {
            quality == "HIGH" && quantity > 0 -> "VERIFIED"
            quality == "MEDIUM" && quantity > 0 -> "PARTIALLY_VERIFIED"
            quality == "LOW" && quantity > 0 -> "MODEL_NOT_VERIFIED"
            else -> "MODEL_NOT_VERIFIED"
        }

        return ProductScanResult(
            productName = productName.ifBlank { "General product" },
            category = category.ifBlank { "General" },
            brand = NOT_VERIFIED,
            model = NOT_VERIFIED,
            variant = NOT_VERIFIED,
            color = NOT_VERIFIED,
            material = NOT_VERIFIED,
            condition = "Unknown",
            quantity = quantity,
            automaticCount = quantity,
            detectionQuality = quality,
            identificationStatus = identificationStatus,
            verificationStatus = if (identificationStatus == "VERIFIED") "VERIFIED" else "PARTIALLY_VERIFIED",
            dimensions = "Dimensions: NOT VERIFIED",
            specificationSummary = "Image-based inspection completed. Product identity and technical details require verified source confirmation.",
            marketStatus = "CURRENT ONLINE PRICE: NOT AVAILABLE",
            priceMessage = "Current online pricing could not be checked because no verified internet data source is available in this build.",
            referencePrice = "NOT VERIFIED",
            currency = "RWF",
            unitPrice = null,
            sourceName = null,
            priceCheckedAt = null,
            totalValue = 0.0,
            imagePath = imagePath,
            searchTerms = listOf(productName.ifBlank { "General product" }, "Rwanda", "Kigali", "price")
        )
    }
}
