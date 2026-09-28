package com.universalcounter.app.ui

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import androidx.appcompat.app.AppCompatActivity
import com.universalcounter.app.R

class StockActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_stock)

        val listView = findViewById<ListView>(R.id.stockList)
        val entries = InventoryStore.loadEntries(this)
        val summary = entries.map { it.asSummary() }
        listView.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, summary)
    }
}
