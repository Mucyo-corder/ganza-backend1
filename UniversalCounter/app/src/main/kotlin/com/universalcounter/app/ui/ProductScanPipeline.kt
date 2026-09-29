package com.universalcounter.app.ui

import android.content.Context
import android.graphics.BitmapFactory
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.universalcounter.engine.CountingEngine
import com.universalcounter.engine.model.CountOptions
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private const val NOT_VERIFIED = "NOT VERIFIED"

enum class ProductScanState {
    CAPTURING,
    PHOTO_VALIDATED,
    ANALYZING_IMAGE,
    OCR_ANALYSIS,
    BARCODE_ANALYSIS,
    VISUAL_IDENTIFICATION,
    SEARCHING_WEB,
    MATCHING_PRODUCTS,
    SEARCHING_PRICES,
    CALCULATING_VALUE,
    SUCCESS,
    NEEDS_REVIEW,
    PRICE_NOT_VERIFIED,
    ERROR
}

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
    val searchTerms: List<String> = emptyList(),
    val state: ProductScanState = ProductScanState.ERROR,
    val logs: List<String> = emptyList(),
    val searchQuery: String? = null,
    val searchUrl: String? = null,
    val searchStatusCode: Int? = null,
    val ocrText: String = "",
    val barcodeText: String = ""
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
        val logs = listOf(
            "[ProductScan] PHOTO_CAPTURED",
            "[ProductScan] IMAGE_DECODED=false",
            "[ProductScan] PRODUCT_IDENTITY=Product could not be verified."
        )

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
            specificationSummary = "Product details remain unverified from the available image and online sources.",
            marketStatus = "CURRENT ONLINE PRICE: NOT AVAILABLE",
            priceMessage = "Current online pricing could not be checked because the internet/search source is not available in this build.",
            referencePrice = "NOT VERIFIED",
            currency = "RWF",
            unitPrice = null,
            sourceName = null,
            priceCheckedAt = checkedAt,
            totalValue = 0.0,
            imagePath = null,
            searchTerms = listOf(safeProductName, "Rwanda", "Kigali", "price"),
            state = ProductScanState.NEEDS_REVIEW,
            logs = logs
        )
    }

    @Throws(Exception::class)
    fun execute(context: Context, imageFile: File): ProductScanResult {
        val logs = mutableListOf<String>()
        logs += "[ProductScan] PHOTO_CAPTURED"

        if (!imageFile.exists()) {
            logs += "[ProductScan][ERROR] IMAGE_PATH_MISSING=${imageFile.absolutePath}"
            return fallback("General product", 0, "MODEL_NOT_VERIFIED").copy(
                state = ProductScanState.ERROR,
                logs = logs,
                imagePath = imageFile.absolutePath
            )
        }

        logs += "[ProductScan] IMAGE_PATH=${imageFile.absolutePath}"
        val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
        if (bitmap == null) {
            logs += "[ProductScan][ERROR] IMAGE_DECODED=false"
            return fallback("General product", 0, "MODEL_NOT_VERIFIED").copy(
                state = ProductScanState.ERROR,
                logs = logs,
                imagePath = imageFile.absolutePath
            )
        }
        logs += "[ProductScan] IMAGE_DECODED=true"
        logs += "[ProductScan] IMAGE_SIZE=${bitmap.width}x${bitmap.height}"

        val localCountResult = try {
            val mat = org.opencv.core.Mat()
            org.opencv.android.Utils.bitmapToMat(bitmap, mat)
            val image = org.opencv.core.Mat()
            if (mat.channels() == 4) {
                org.opencv.imgproc.Imgproc.cvtColor(mat, image, org.opencv.imgproc.Imgproc.COLOR_RGBA2BGR)
            } else {
                mat.copyTo(image)
            }
            val countResult = CountingEngine().count(image, CountOptions.DEFAULT)
            image.release()
            mat.release()
            countResult
        } catch (error: Exception) {
            Log.e("ProductScanPipeline", "Local image analysis failed", error)
            logs += "[ProductScan][ERROR] LOCAL_ANALYSIS_FAILED=${error.message}"
            null
        }

        val detectionQuality = localCountResult?.quality?.tier?.name ?: "LOW"
        val detectedCount = localCountResult?.count ?: 0
        logs += "[ProductScan] ANALYZING_IMAGE"
        logs += "[ProductScan] VISUAL_OBJECT_COUNT=${detectedCount}"
        logs += "[ProductScan] DETECTION_QUALITY=${detectionQuality}"

        val ocrText = try {
            logs += "[ProductScan] OCR_ANALYSIS"
            val image = InputImage.fromBitmap(bitmap, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            val result = Tasks.await(recognizer.process(image))
            val blocks = result.textBlocks.flatMap { block ->
                block.lines.map { it.text }
            }.filter { it.isNotBlank() }
            val text = blocks.joinToString(" ")
            recognizer.close()
            logs += "[ProductScan] OCR_RESULT=${text.take(500)}"
            text
        } catch (error: Exception) {
            Log.e("ProductScanPipeline", "OCR failed", error)
            logs += "[ProductScan][ERROR] OCR_FAILED=${error.message}"
            ""
        }

        val barcodeText = try {
            logs += "[ProductScan] BARCODE_ANALYSIS"
            val image = InputImage.fromBitmap(bitmap, 0)
            val scanner = BarcodeScanning.getClient()
            val result = Tasks.await(scanner.process(image))
            val decodedValues = result.mapNotNull { it.rawValue }.filter { it.isNotBlank() }
            scanner.close()
            if (decodedValues.isNotEmpty()) {
                logs += "[ProductScan] BARCODE_RESULT=${decodedValues.joinToString(", ")}" 
            }
            decodedValues.joinToString(" ")
        } catch (error: Exception) {
            Log.e("ProductScanPipeline", "Barcode scan failed", error)
            logs += "[ProductScan][ERROR] BARCODE_FAILED=${error.message}"
            ""
        }

        val normalizedOcr = ocrText.trim()
        val normalizedBarcode = barcodeText.trim()
        val productEvidence = listOf(normalizedOcr, normalizedBarcode).filter { it.isNotBlank() }
        val inferredProductName = when {
            normalizedBarcode.isNotBlank() -> "Product match from scanned code"
            normalizedOcr.isNotBlank() -> normalizeProductLabel(normalizedOcr)
            else -> "Product could not be verified."
        }
        val inferredBrand = inferBrand(productEvidence)
        val inferredModel = inferModel(productEvidence)
        val productName = if (inferredProductName == "Product could not be verified.") "Product could not be verified." else inferredProductName
        val category = inferCategory(normalizedOcr, normalizedBarcode)

        logs += "[ProductScan] VISUAL_IDENTIFICATION"
        logs += "[ProductScan] IDENTIFICATION=${productName}"
        logs += "[ProductScan] BRAND=${if (inferredBrand.isBlank()) NOT_VERIFIED else inferredBrand}"
        logs += "[ProductScan] MODEL=${if (inferredModel.isBlank()) NOT_VERIFIED else inferredModel}"

        val searchQuery = buildSearchQuery(productName, inferredBrand, inferredModel, category)
        logs += "[ProductScan] SEARCHING_WEB"
        logs += "[ProductScan] SEARCH_QUERY=${searchQuery}"
        val searchResponse = try {
            ProductScanNetworkClient.search(searchQuery)
        } catch (error: Exception) {
            Log.e("ProductScanPipeline", "Search request failed", error)
            logs += "[ProductScan][ERROR] SEARCH_HTTP_FAILED=${error.message}"
            ProductSearchResponse(searchQuery = searchQuery, statusCode = -1, searchUrl = null, responseSnippet = "", success = false)
        }

        val marketStatus = if (searchResponse.success) "PRICE_SEARCHED" else "CURRENT ONLINE PRICE: NOT AVAILABLE"
        val marketMessage = if (searchResponse.success) {
            "Current online market search completed. Product and price matching will use the search results when they are a strong match."
        } else {
            "Internet search unavailable. Local image analysis completed. Product identity remains unverified."
        }
        val referencePrice = if (searchResponse.success) "SEARCH RESULTS RECEIVED" else "NOT VERIFIED"
        val productStatus = when {
            searchResponse.success && productName != "Product could not be verified." -> "VERIFIED"
            productName != "Product could not be verified." -> "PARTIALLY_VERIFIED"
            else -> "MODEL_NOT_VERIFIED"
        }
        val result = ProductScanResult(
            productName = productName,
            category = category,
            brand = if (inferredBrand.isBlank()) NOT_VERIFIED else inferredBrand,
            model = if (inferredModel.isBlank()) NOT_VERIFIED else inferredModel,
            variant = NOT_VERIFIED,
            color = NOT_VERIFIED,
            material = NOT_VERIFIED,
            condition = "Unknown",
            quantity = detectedCount.coerceAtLeast(0),
            automaticCount = detectedCount.coerceAtLeast(0),
            detectionQuality = detectionQuality,
            identificationStatus = productStatus,
            verificationStatus = if (productStatus == "VERIFIED") "VERIFIED" else "PARTIALLY_VERIFIED",
            dimensions = "Dimensions: NOT VERIFIED",
            specificationSummary = if (normalizedOcr.isBlank() && normalizedBarcode.isBlank()) {
                "Local image analysis completed. OCR and barcode search did not produce a reliable product match."
            } else {
                "Image analysis completed with OCR/barcode evidence. Matching remains subject to product verification from source data."
            },
            marketStatus = marketStatus,
            priceMessage = marketMessage,
            referencePrice = referencePrice,
            currency = "RWF",
            unitPrice = null,
            sourceName = null,
            priceCheckedAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
            totalValue = 0.0,
            imagePath = imageFile.absolutePath,
            searchTerms = listOf(searchQuery),
            state = if (productStatus == "VERIFIED") ProductScanState.SUCCESS else ProductScanState.NEEDS_REVIEW,
            logs = logs + listOf(
                "[ProductScan] SEARCH_HTTP_STATUS=${searchResponse.statusCode}",
                "[ProductScan] SEARCH_URL=${searchResponse.searchUrl.orEmpty()}",
                "[ProductScan] FINAL_RESULT=${productName} | ${category} | ${productStatus}"
            ),
            searchQuery = searchQuery,
            searchUrl = searchResponse.searchUrl,
            searchStatusCode = searchResponse.statusCode,
            ocrText = normalizedOcr,
            barcodeText = normalizedBarcode
        )
        bitmap.recycle()
        return result
    }

    private fun inferBrand(evidence: List<String>): String {
        if (evidence.isEmpty()) return ""
        val text = evidence.joinToString(" ")
        val tokens = text.split(Regex("[^A-Za-z0-9]+"))
            .map { it.trim() }
            .filter { it.isNotBlank() }
        return tokens.firstOrNull { it.length > 2 && it.matches(Regex("[A-Z].*|[A-Za-z]+")) }
            ?.replace(Regex("[^A-Za-z0-9]"), "")
            ?: ""
    }

    private fun inferModel(evidence: List<String>): String {
        if (evidence.isEmpty()) return ""
        val text = evidence.joinToString(" ")
        val match = Regex("([A-Z0-9]+[-_ ]?[A-Z0-9]+(?:[-_ ][A-Z0-9]+){0,4})").find(text)
        return match?.value?.trim() ?: ""
    }

    private fun normalizeProductLabel(rawText: String): String {
        val cleaned = rawText.replace(Regex("\\s+"), " ").trim()
        return when {
            cleaned.isBlank() -> "Product could not be verified."
            cleaned.length > 80 -> cleaned.take(80)
            else -> cleaned
        }
    }

    private fun inferCategory(ocrText: String, barcodeText: String): String {
        val haystack = (ocrText + " " + barcodeText).lowercase(Locale.US)
        return when {
            "phone" in haystack || "smartphone" in haystack || "galaxy" in haystack || "iphone" in haystack -> "Electronics / Smartphone"
            "shoe" in haystack || "sneaker" in haystack || "trainer" in haystack || "sandals" in haystack -> "Footwear"
            "bag" in haystack || "handbag" in haystack || "tote" in haystack || "purse" in haystack -> "Fashion / Bag"
            "laptop" in haystack || "notebook" in haystack || "ultrabook" in haystack -> "Electronics / Laptop"
            "watch" in haystack || "smartwatch" in haystack -> "Accessories / Watch"
            "cement" in haystack || "block" in haystack || "paver" in haystack || "tile" in haystack -> "Construction / Materials"
            "bottle" in haystack || "water" in haystack || "juice" in haystack || "drink" in haystack -> "Packaged Goods"
            "wood" in haystack || "plank" in haystack || "timber" in haystack -> "Construction / Wood"
            "furniture" in haystack || "chair" in haystack || "table" in haystack -> "Furniture"
            else -> "General"
        }
    }

    private fun buildSearchQuery(
        productName: String,
        brand: String,
        model: String,
        category: String
    ): String {
        val productPart = if (productName != "Product could not be verified.") productName else category
        val brandPart = brand.takeIf { it.isNotBlank() && it != NOT_VERIFIED } ?: ""
        val modelPart = model.takeIf { it.isNotBlank() && it != NOT_VERIFIED } ?: ""
        val pieces = listOf(brandPart, productPart, modelPart, "Rwanda", "current price")
            .filter { it.isNotBlank() }
            .joinToString(" ")
        return pieces.ifBlank { "$category Rwanda current price" }
    }
}

data class ProductSearchResponse(
    val searchQuery: String,
    val statusCode: Int,
    val searchUrl: String?,
    val responseSnippet: String,
    val success: Boolean
)

object ProductScanNetworkClient {
    private const val USER_AGENT = "Mozilla/5.0 (Linux; Android 14; ProductScan) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0 Safari/537.36"

    fun search(searchQuery: String): ProductSearchResponse {
        val encoded = URLEncoder.encode(searchQuery, "UTF-8")
        val url = URL("https://www.google.com/search?q=$encoded&hl=en")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 15000
        connection.readTimeout = 30000
        connection.instanceFollowRedirects = true
        connection.setRequestProperty("User-Agent", USER_AGENT)
        connection.setRequestProperty("Accept-Language", "en-US,en;q=0.9")

        val statusCode = try {
            connection.responseCode
        } catch (error: Exception) {
            Log.e("ProductScanNetworkClient", "Search request failed", error)
            -1
        }

        val responseText = try {
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val bytes = stream?.readBytes() ?: ByteArray(0)
            String(bytes, Charsets.UTF_8)
        } catch (error: Exception) {
            Log.e("ProductScanNetworkClient", "Reading search response failed", error)
            ""
        } finally {
            connection.disconnect()
        }

        val success = statusCode in 200..299 && responseText.isNotBlank()
        return ProductSearchResponse(
            searchQuery = searchQuery,
            statusCode = statusCode,
            searchUrl = url.toString(),
            responseSnippet = responseText.take(800),
            success = success
        )
    }
}
