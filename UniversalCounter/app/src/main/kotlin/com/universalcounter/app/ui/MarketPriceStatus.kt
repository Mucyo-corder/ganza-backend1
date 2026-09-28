package com.universalcounter.app.ui

data class MarketPriceStatus(
    val status: String,
    val message: String,
    val unitPrice: Double? = null,
    val source: String? = null,
    val checkedAt: String? = null,
    val currency: String = "RWF"
) {
    companion object {
        fun offline(message: String = "Current online market price cannot be checked."): MarketPriceStatus =
            MarketPriceStatus(
                status = "OFFLINE",
                message = message,
                unitPrice = null,
                source = null,
                checkedAt = null,
                currency = "RWF"
            )

        fun found(unitPrice: Double, source: String, checkedAt: String): MarketPriceStatus =
            MarketPriceStatus(
                status = "PRICE_FOUND",
                message = "Current online market price found.",
                unitPrice = unitPrice,
                source = source,
                checkedAt = checkedAt,
                currency = "RWF"
            )

        fun unavailable(message: String = "I found no sufficiently reliable current online price."): MarketPriceStatus =
            MarketPriceStatus(
                status = "PRICE_NOT_FOUND",
                message = message,
                unitPrice = null,
                source = null,
                checkedAt = null,
                currency = "RWF"
            )
    }
}
