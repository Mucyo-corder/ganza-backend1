package com.universalcounter.app.ui

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.universalcounter.app.R
import java.text.NumberFormat
import java.util.Locale

class ValueActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_value)

        val totalValueText = findViewById<TextView>(R.id.totalValueText)
        val entries = InventoryStore.loadEntries(this)
        val total = entries.sumOf { it.totalValue }
        val fmt = NumberFormat.getCurrencyInstance(Locale.US)
        fmt.maximumFractionDigits = 2
        totalValueText.text = "Total stock value\n${fmt.format(total)}"
    }
}
