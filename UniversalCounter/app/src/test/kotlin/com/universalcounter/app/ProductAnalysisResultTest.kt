package com.universalcounter.app

import com.universalcounter.app.ui.ProductAnalysisResult
import com.universalcounter.app.ui.MarketPriceStatus
import com.universalcounter.app.ui.PhotoQualityStatus
import com.universalcounter.app.ui.resolveVerificationStatus
import com.universalcounter.app.ui.statusAfterAnalysisFailure
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

    @Test
    fun `uncertain automatic counts remain pending until manually corrected`() {
        assertEquals("PENDING_VERIFICATION", resolveVerificationStatus(7, 7, "PENDING_VERIFICATION", "NEEDS_REVIEW"))
        assertEquals("MANUALLY_CORRECTED", resolveVerificationStatus(7, 8, "PENDING_VERIFICATION", "NEEDS_REVIEW"))
        assertEquals("VERIFIED", resolveVerificationStatus(7, 7, "VERIFIED", "HIGH"))
    }

    @Test
    fun `analysis failure does not invalidate a decoded photo`() {
        assertEquals(PhotoQualityStatus.NEEDS_REVIEW, statusAfterAnalysisFailure(imageDecoded = true))
        assertEquals(PhotoQualityStatus.INVALID, statusAfterAnalysisFailure(imageDecoded = false))
    }
}
