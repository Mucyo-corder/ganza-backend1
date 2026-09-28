package com.universalcounter.app

import com.universalcounter.app.ui.ProductAnalysisResult
import com.universalcounter.app.ui.MarketPriceStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ProductAnalysisResultTest {
    @Test
    fun `unreliable photo produces honest user guidance`() {
        val result = ProductAnalysisResult(
            productName = "Unclassified item",
            category = "General",
            quantity = 0,
            quality = "UNRELIABLE",
            detectionSummary = "I cannot determine this reliably from this photo.",
            requiresConfirmation = true
        )

        assertEquals("Unclassified item", result.productName)
        assertTrue(result.requiresConfirmation)
        assertTrue(result.detectionSummary.contains("cannot determine"))
    }

    @Test
    fun `offline price search never invents a value`() {
        val status = MarketPriceStatus.offline("Current online market price cannot be checked.")

        assertEquals("OFFLINE", status.status)
        assertNull(status.unitPrice)
        assertTrue(status.message.contains("cannot be checked"))
    }
}
