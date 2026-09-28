package com.universalcounter.app.ui

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.util.Locale

private const val PREFS_NAME = "universal_counter_store"
private const val KEY_ENTRIES = "inventory_entries"

data class StockEntry(
    val productName: String,
    val quantity: Int,
    val unitPrice: Double,
    val currency: String,
    val totalValue: Double,
    val imagePath: String,
    val timestamp: String,
    val verificationStatus: String,
    val countQuality: String
) {
    fun asSummary(): String {
        val fmt = NumberFormat.getCurrencyInstance(Locale.US)
        fmt.currency = java.util.Currency.getInstance(currency)
        return "$productName • Qty $quantity • ${fmt.format(totalValue)} • ${verificationStatus}"
    }
}

object InventoryStore {
    fun saveEntry(context: Context, entry: StockEntry) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val entries = loadEntries(context).toMutableList()
        entries.add(0, entry)
        val json = JSONArray()
        entries.forEach { e ->
            val obj = JSONObject()
            obj.put("productName", e.productName)
            obj.put("quantity", e.quantity)
            obj.put("unitPrice", e.unitPrice)
            obj.put("currency", e.currency)
            obj.put("totalValue", e.totalValue)
            obj.put("imagePath", e.imagePath)
            obj.put("timestamp", e.timestamp)
            obj.put("verificationStatus", e.verificationStatus)
            obj.put("countQuality", e.countQuality)
            json.put(obj)
        }
        prefs.edit().putString(KEY_ENTRIES, json.toString()).apply()
    }

    fun loadEntries(context: Context): List<StockEntry> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_ENTRIES, "[]") ?: "[]"
        val entries = mutableListOf<StockEntry>()
        val array = JSONArray(raw)
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            entries.add(
                StockEntry(
                    productName = obj.optString("productName", "Unknown product"),
                    quantity = obj.optInt("quantity", 0),
                    unitPrice = obj.optDouble("unitPrice", 0.0),
                    currency = obj.optString("currency", "RWF"),
                    totalValue = obj.optDouble("totalValue", 0.0),
                    imagePath = obj.optString("imagePath", ""),
                    timestamp = obj.optString("timestamp", ""),
                    verificationStatus = obj.optString("verificationStatus", "UNVERIFIED"),
                    countQuality = obj.optString("countQuality", "LOW")
                )
            )
        }
        return entries
    }
}
