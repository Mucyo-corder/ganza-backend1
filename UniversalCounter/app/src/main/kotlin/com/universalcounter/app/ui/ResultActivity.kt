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
        val unitPriceField = findViewById<EditText>(R.id.unitPriceField)
        val totalsText = findViewById<TextView>(R.id.totalValueText)
        val saveButton = findViewById<Button>(R.id.saveButton)
        val retakeButton = findViewById<Button>(R.id.retakeButton)
        val countLabel = findViewById<TextView>(R.id.countLabel)

        val photoPath = intent.getStringExtra("photo_path") ?: ""
        val rawCount = intent.getStringExtra("count") ?: "0"
        val quality = intent.getStringExtra("quality") ?: "LOW"
        val status = intent.getStringExtra("status") ?: "RETAKE PHOTO"
        val reason = intent.getStringExtra("reason") ?: ""

        if (photoPath.isNotBlank()) {
            val file = File(photoPath)
            if (file.exists()) {
                imageView.setImageURI(Uri.fromFile(file))
            }
        }

        val numericCount = if (rawCount.toIntOrNull() != null) rawCount.toInt() else 0
        countText.text = rawCount
        qualityText.text = quality
        countLabel.text = if (status == "VERIFIED") "Detected objects" else "Count status"

        val totalUpdater = {
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val total = numericCount * unitPrice
            totalsText.text = "Total value\n${NumberFormat.getCurrencyInstance(Locale.US).format(total)}"
        }

        unitPriceField.setText("0")
        unitPriceField.setOnFocusChangeListener { _, _ -> totalUpdater() }
        unitPriceField.setOnEditorActionListener { _, _, _ ->
            totalUpdater(); true
        }
        totalUpdater()

        saveButton.setOnClickListener {
            val productName = productField.text.toString().ifBlank { "Unknown product" }
            val unitPrice = unitPriceField.text.toString().toDoubleOrNull() ?: 0.0
            val total = numericCount * unitPrice
            val entry = StockEntry(
                productName = productName,
                quantity = numericCount,
                unitPrice = unitPrice,
                currency = "USD",
                totalValue = total,
                imagePath = photoPath,
                timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                verificationStatus = status,
                countQuality = quality
            )
            InventoryStore.saveEntry(this, entry)
            startActivity(Intent(this, StockActivity::class.java))
            finish()
        }

        retakeButton.setOnClickListener {
            finish()
        }

        if (rawCount.contains("UNABLE", ignoreCase = true)) {
            countText.text = "UNABLE TO COUNT RELIABLY"
            qualityText.text = "LOW"
            countLabel.text = "Status"
            totalsText.text = "Unit price not set"
        }

        if (reason.isNotBlank()) {
            findViewById<TextView>(R.id.reasonText).text = reason
        }
    }
}
