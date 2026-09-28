package com.universalcounter.app.ui

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import androidx.appcompat.app.AppCompatActivity
import com.universalcounter.app.R

class HistoryActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_history)

        val listView = findViewById<ListView>(R.id.historyList)
        val entries = InventoryStore.loadEntries(this)
        val summary = entries.map {
            "${it.timestamp}\n${it.productName} • Qty ${it.quantity} • ${it.currency} ${it.totalValue.toLong()} • ${it.verificationStatus} • ${it.countQuality}"
        }
        listView.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, summary)
    }
}
