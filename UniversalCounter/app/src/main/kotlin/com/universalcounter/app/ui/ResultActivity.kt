package com.universalcounter.app.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
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
        val quantityField = findViewById<EditText>(R.id.quantityField)
        val dimensionsField = findViewById<EditText>(R.id.dimensionsField)
        val conditionField = findViewById<EditText>(R.id.conditionField)
        val unitPriceField = findViewById<EditText>(R.id.unitPriceField)
        val priceStatusText = findViewById<TextView>(R.id.priceStatusText)
        val totalsText = findViewById<TextView>(R.id.totalValueText)
        val saveButton = findViewById<Button>(R.id.saveButton)
        val retakeButton = findViewById<Button>(R.id.retakeButton)
        val countLabel = findViewById<TextView>(R.id.countLabel)

        val photoPath = intent.getStringExtra("photo_path") ?: ""
        val rawCount = intent.getIntExtra("count", 0)
        val quality = intent.getStringExtra("quality") ?: "LOW"
        val status = intent.getStringExtra("status") ?: "PENDING_VERIFICATION"
        val productName = intent.getStringExtra("product_name") ?: "Unclassified item"
        val category = intent.getStringExtra("category") ?: "General"
        val detectionSummary = intent.getStringExtra("detection_summary") ?: "I cannot determine this reliably from this photo."
        val userActionHint = intent.getStringExtra("user_action_hint") ?: "Please retake the photo with a clearer, single product group in frame."
        val reason = intent.getStringExtra("reason") ?: ""
        val marketStatus = intent.getStringExtra("market_status") ?: "OFFLINE"
        val marketMessage = intent.getStringExtra("market_message") ?: "Current online market price cannot be checked."
        val marketCurrency = intent.getStringExtra("market_currency") ?: "RWF"

        if (photoPath.isNotBlank()) {
            val file = File(photoPath)
            if (file.exists()) {
                imageView.setImageURI(Uri.fromFile(file))
            }
        }

        val quantityValue = rawCount.coerceAtLeast(0)
        countText.text = if (quantityValue > 0) quantityValue.toString() else "UNABLE TO COUNT RELIABLY"
        qualityText.text = quality
        countLabel.text = if (status == "VERIFIED") "Detected objects" else "Count status"

        productField.setText(productName)
        quantityField.setText(quantityValue.toString())
        dimensionsField.setText(intent.getStringExtra("dimensions") ?: "Dimension unavailable")
        conditionField.setText("Unknown")
        priceStatusText.text = "PRICE STATUS: $marketStatus\n$marketMessage"

        val totalUpdater = {
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val updatedQuantity = quantityField.text.toString().toIntOrNull() ?: quantityValue
            val total = updatedQuantity * unitPrice
            val fmt = NumberFormat.getCurrencyInstance(Locale.US)
            fmt.currency = java.util.Currency.getInstance(marketCurrency)
            totalsText.text = "Estimated market value\n${fmt.format(total)}"
        }

        unitPriceField.setText("0")
        unitPriceField.setOnFocusChangeListener { _, _ -> totalUpdater() }
        unitPriceField.setOnEditorActionListener { _, _, _ ->
            totalUpdater(); true
        }
        quantityField.setOnFocusChangeListener { _, _ -> totalUpdater() }
        totalUpdater()

        saveButton.setOnClickListener {
            val finalProductName = productField.text.toString().ifBlank { "Unclassified item" }
            val finalQuantity = quantityField.text.toString().toIntOrNull() ?: quantityValue
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val total = finalQuantity * unitPrice
            val verificationStatus = if (finalQuantity <= 0 || unitPrice <= 0.0 || quality.equals("UNRELIABLE", ignoreCase = true)) "PENDING_VERIFICATION" else "VERIFIED"
            val entry = StockEntry(
                productName = finalProductName,
                quantity = finalQuantity,
                unitPrice = unitPrice,
                currency = marketCurrency,
                totalValue = total,
                imagePath = photoPath,
                timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                verificationStatus = verificationStatus,
                countQuality = quality
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
            if (userActionHint.isNotBlank()) {
                append("\n")
                append(userActionHint)
            }
            if (reason.isNotBlank()) {
                append("\n")
                append(reason)
            }
            append("\nDetected category: ")
            append(category)
        }
        findViewById<TextView>(R.id.reasonText).text = detailText

        if (quantityValue <= 0 || quality.equals("UNRELIABLE", ignoreCase = true)) {
            countText.text = "UNABLE TO COUNT RELIABELY"
            qualityText.text = "UNRELIABLE"
            countLabel.text = "Status"
            totalsText.text = "Estimated market value\nNot verified"
            priceStatusText.text = "PRICE STATUS: OFFLINE\nCurrent online market price cannot be checked. Please enter a unit price and confirm before saving."
        }
    }
}
