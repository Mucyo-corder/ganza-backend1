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
    val countQuality: String,
    val category: String = "",
    val brand: String = "",
    val model: String = "",
    val automaticCount: Int = quantity,
    val manualCount: Int? = null,
    val countSource: String = "COMPUTER_VISION",
    val length: Double? = null,
    val width: Double? = null,
    val height: Double? = null,
    val dimensionUnit: String? = null,
    val measurementMethod: String = "NOT_MEASURED",
    val priceSources: List<String> = emptyList(),
    val priceCheckedAt: String? = null
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
            obj.put("category", e.category)
            obj.put("brand", e.brand)
            obj.put("model", e.model)
            obj.put("automaticCount", e.automaticCount)
            if (e.manualCount == null) obj.put("manualCount", org.json.JSONObject.NULL) else obj.put("manualCount", e.manualCount)
            obj.put("finalCount", e.quantity)
            obj.put("countSource", e.countSource)
            if (e.length == null) obj.put("length", org.json.JSONObject.NULL) else obj.put("length", e.length)
            if (e.width == null) obj.put("width", org.json.JSONObject.NULL) else obj.put("width", e.width)
            if (e.height == null) obj.put("height", org.json.JSONObject.NULL) else obj.put("height", e.height)
            if (e.dimensionUnit == null) obj.put("dimensionUnit", org.json.JSONObject.NULL) else obj.put("dimensionUnit", e.dimensionUnit)
            obj.put("measurementMethod", e.measurementMethod)
            obj.put("priceSources", JSONArray(e.priceSources))
            if (e.priceCheckedAt == null) obj.put("priceCheckedAt", org.json.JSONObject.NULL) else obj.put("priceCheckedAt", e.priceCheckedAt)
            obj.put("detectionQuality", e.countQuality)
            obj.put("createdAt", e.timestamp)
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
                    quantity = obj.optInt("finalCount", obj.optInt("quantity", 0)),
                    unitPrice = obj.optDouble("unitPrice", 0.0),
                    currency = obj.optString("currency", "RWF"),
                    totalValue = obj.optDouble("totalValue", 0.0),
                    imagePath = obj.optString("imagePath", ""),
                    timestamp = obj.optString("timestamp", ""),
                    verificationStatus = obj.optString("verificationStatus", "UNVERIFIED"),
                    countQuality = obj.optString("detectionQuality", obj.optString("countQuality", "LOW")),
                    category = obj.optString("category", ""),
                    brand = obj.optString("brand", ""),
                    model = obj.optString("model", ""),
                    automaticCount = obj.optInt("automaticCount", obj.optInt("quantity", 0)),
                    manualCount = if (obj.isNull("manualCount")) null else obj.optInt("manualCount"),
                    countSource = obj.optString("countSource", "COMPUTER_VISION"),
                    length = if (obj.isNull("length")) null else obj.optDouble("length"),
                    width = if (obj.isNull("width")) null else obj.optDouble("width"),
                    height = if (obj.isNull("height")) null else obj.optDouble("height"),
                    dimensionUnit = if (obj.isNull("dimensionUnit")) null else obj.optString("dimensionUnit"),
                    measurementMethod = obj.optString("measurementMethod", "NOT_MEASURED"),
                    priceSources = obj.optJSONArray("priceSources")?.let { sources ->
                        List(sources.length()) { index -> sources.optString(index) }
                    } ?: emptyList(),
                    priceCheckedAt = if (obj.isNull("priceCheckedAt")) null else obj.optString("priceCheckedAt")
                )
            )
        }
        return entries
    }
}
