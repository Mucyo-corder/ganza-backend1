package com.universalcounter.app.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.universalcounter.app.R
import java.io.File
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ResultActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_result)

        val imageView = findViewById<ImageView>(R.id.resultImage)
        val countText = findViewById<TextView>(R.id.countValue)
        val qualityText = findViewById<TextView>(R.id.qualityValue)
        val productField = findViewById<EditText>(R.id.productNameField)
        val categoryField = findViewById<EditText>(R.id.categoryField)
        val brandField = findViewById<EditText>(R.id.brandField)
        val modelField = findViewById<EditText>(R.id.modelField)
        val quantityField = findViewById<EditText>(R.id.quantityField)
        val lengthField = findViewById<EditText>(R.id.lengthField)
        val widthField = findViewById<EditText>(R.id.widthField)
        val heightField = findViewById<EditText>(R.id.heightField)
        val dimensionUnitSpinner = findViewById<Spinner>(R.id.dimensionUnitSpinner)
        val conditionField = findViewById<EditText>(R.id.conditionField)
        val unitPriceField = findViewById<EditText>(R.id.unitPriceField)
        val priceSourceField = findViewById<EditText>(R.id.priceSourceField)
        val priceStatusText = findViewById<TextView>(R.id.priceStatusText)
        val totalsText = findViewById<TextView>(R.id.totalValueText)
        val saveButton = findViewById<Button>(R.id.saveButton)
        val retakeButton = findViewById<Button>(R.id.retakeButton)
        val countLabel = findViewById<TextView>(R.id.countLabel)
        val decreaseCountButton = findViewById<Button>(R.id.decreaseCountButton)
        val increaseCountButton = findViewById<Button>(R.id.increaseCountButton)
        val marketSearchButton = findViewById<Button>(R.id.marketSearchButton)

        val photoPath = intent.getStringExtra("photo_path") ?: ""
        val rawCount = intent.getIntExtra("count", 0)
        val quality = intent.getStringExtra("quality") ?: "LOW"
        val status = intent.getStringExtra("status") ?: "PENDING_VERIFICATION"
        val productName = intent.getStringExtra("product_name") ?: "General product"
        val category = intent.getStringExtra("category") ?: "General"
        val brand = intent.getStringExtra("brand") ?: "NOT VERIFIED"
        val model = intent.getStringExtra("model") ?: "NOT VERIFIED"
        val condition = intent.getStringExtra("condition") ?: "Unknown"
        val detectionSummary = intent.getStringExtra("detection_summary") ?: "I cannot determine this reliably from this photo."
        val userActionHint = intent.getStringExtra("user_action_hint") ?: "Please retake the photo with a clearer, single product group in frame."
        val reason = intent.getStringExtra("reason") ?: ""
        val marketStatus = intent.getStringExtra("market_status") ?: "CURRENT ONLINE PRICE: NOT AVAILABLE"
        val marketMessage = intent.getStringExtra("market_message") ?: "Current online market price cannot be checked."
        val marketCurrency = intent.getStringExtra("market_currency") ?: "RWF"

        val overlayPath = intent.getStringExtra("overlay_path").orEmpty()
        val displayPath = overlayPath.ifBlank { photoPath }
        if (displayPath.isNotBlank()) {
            val file = File(displayPath)
            if (file.exists()) {
                imageView.setImageURI(Uri.fromFile(file))
            }
        }

        val quantityValue = rawCount.coerceAtLeast(0)
        countText.text = quantityValue.toString()
        qualityText.text = quality
        countLabel.text = "Detected objects"

        productField.setText(productName)
        categoryField.setText(category.takeUnless { it == "General" }.orEmpty())
        brandField.setText(brand)
        modelField.setText(model)
        quantityField.setText(quantityValue.toString())
        conditionField.setText(condition)
        dimensionUnitSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            listOf("mm", "cm", "m")
        )
        val priceLabel = when {
            marketStatus.contains("NOT AVAILABLE", ignoreCase = true) -> "CURRENT ONLINE PRICE: NOT AVAILABLE"
            marketStatus.contains("PRICE_NOT_FOUND", ignoreCase = true) -> "PRICE_NOT_VERIFIED"
            else -> marketStatus
        }
        priceStatusText.text = "PRICE STATUS: $priceLabel\n$marketMessage"

        marketSearchButton.setOnClickListener {
            val searchTerms = listOf(productField.text.toString(), brandField.text.toString(), modelField.text.toString(), categoryField.text.toString(), "Rwanda Kigali price")
                .filter { it.isNotBlank() }
                .joinToString(" ")
            val searchIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=${Uri.encode(searchTerms)}"))
            startActivity(searchIntent)
        }

        val totalUpdater = {
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val updatedQuantity = quantityField.text.toString().toIntOrNull() ?: 0
            val total = updatedQuantity * unitPrice
            val fmt = NumberFormat.getCurrencyInstance(Locale.US)
            fmt.currency = java.util.Currency.getInstance(marketCurrency)
            val valueLabel = if (marketStatus.contains("NOT AVAILABLE", ignoreCase = true) || marketStatus.contains("PRICE_NOT_FOUND", ignoreCase = true)) "Estimated Market Value" else "Verified Value"
            totalsText.text = "$valueLabel\n${fmt.format(total)}"
        }

        fun refreshCountStatus() {
            val correctedCount = quantityField.text.toString().toIntOrNull()
            qualityText.text = if (correctedCount != null && correctedCount != quantityValue) "MANUALLY_CORRECTED" else quality
            totalUpdater()
        }

        unitPriceField.setText(intent.getDoubleExtra("unit_price", 0.0).let { if (it <= 0.0) "0" else it.toString() })
        val valueWatcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                totalUpdater()
            }
            override fun afterTextChanged(s: Editable?) = Unit
        }
        unitPriceField.addTextChangedListener(valueWatcher)
        quantityField.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = refreshCountStatus()
            override fun afterTextChanged(s: Editable?) = Unit
        })
        decreaseCountButton.setOnClickListener {
            quantityField.setText(((quantityField.text.toString().toIntOrNull() ?: 0) - 1).coerceAtLeast(0).toString())
        }
        increaseCountButton.setOnClickListener {
            quantityField.setText(((quantityField.text.toString().toIntOrNull() ?: 0) + 1).toString())
        }
        totalUpdater()

        saveButton.setOnClickListener {
            val finalProductName = productField.text.toString().ifBlank { "Unclassified item" }
            val finalQuantity = quantityField.text.toString().toIntOrNull()
            if (finalQuantity == null || finalQuantity < 0) {
                quantityField.error = "Enter a valid count"
                return@setOnClickListener
            }
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val total = finalQuantity * unitPrice
            val manuallyCorrected = finalQuantity != quantityValue
            val enteredDimensions = listOf(lengthField, widthField, heightField).map { it.text.toString().toDoubleOrNull() }
            val measuredDimensions = enteredDimensions.any { it != null }
            val entry = StockEntry(
                productName = finalProductName,
                quantity = finalQuantity,
                unitPrice = unitPrice,
                currency = marketCurrency,
                totalValue = total,
                imagePath = photoPath,
                timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                verificationStatus = resolveVerificationStatus(quantityValue, finalQuantity, status, qualityText.text.toString()),
                countQuality = qualityText.text.toString(),
                category = categoryField.text.toString(),
                brand = brandField.text.toString(),
                model = modelField.text.toString(),
                automaticCount = quantityValue,
                manualCount = if (manuallyCorrected) finalQuantity else null,
                countSource = if (manuallyCorrected) "MANUAL_CORRECTION" else "COMPUTER_VISION",
                length = enteredDimensions[0],
                width = enteredDimensions[1],
                height = enteredDimensions[2],
                dimensionUnit = if (measuredDimensions) dimensionUnitSpinner.selectedItem.toString() else null,
                measurementMethod = if (measuredDimensions) "USER_MEASURED" else "NOT_MEASURED",
                priceSources = priceSourceField.text.toString().trim().takeIf { it.isNotEmpty() }?.let(::listOf) ?: emptyList(),
                priceCheckedAt = if (unitPrice > 0.0 && priceSourceField.text.toString().isNotBlank()) {
                    SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())
                } else null
            )
            InventoryStore.saveEntry(this, entry)
            startActivity(Intent(this, StockActivity::class.java))
            finish()
        }

        retakeButton.setOnClickListener {
            finish()
        }

        val detailText = buildString {
            append(detectionSummary)
            if (intent.getStringExtra("photo_status") == "INVALID") {
                append("\nIFOTO NTIYAKORESHWA. Gerageza gufata ifoto ifite urumuri ruri neza kandi ibintu bigaragara.")
                append("\nYou can still enter the count and measurements below.")
            } else if (quality == "NEEDS_REVIEW") {
                append("\nHindura umubare niba bikenewe.")
            }
            if (userActionHint.isNotBlank()) {
                append("\n")
                append(userActionHint)
            }
            if (reason.isNotBlank()) {
                append("\n")
                append(reason)
            }
            append("\nProduct identification: NEEDS REVIEW")
            append("\nDimensions: NOT MEASURED unless entered below")
        }
        findViewById<TextView>(R.id.reasonText).text = detailText

        if (quantityValue <= 0) {
            countText.text = "0"
            qualityText.text = "NEEDS_REVIEW"
            countLabel.text = "Enter the count manually"
            totalsText.text = "Estimated Market Value\nNot verified"
            priceStatusText.text = "PRICE STATUS: PRICE_NOT_VERIFIED\nCurrent online market price cannot be checked. Enter a count and unit price, or retake the photo."
        }
    }
}
