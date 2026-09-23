package com.ganza.app.agent

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.ganza.app.accessibility.GanzaAccessibilityService
import com.ganza.app.notifications.GanzaNotificationListener

@ReactModule(name = "GanzaAgent")
class AgentBridge(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "GanzaAgent"

    @ReactMethod
    fun getCapabilityStatus(promise: Promise) {
        val map = Arguments.createMap().apply {
            putBoolean("accessibilityEnabled", GanzaAccessibilityService.isEnabled())
            putBoolean("notificationEnabled", GanzaNotificationListener.isEnabled())
            putString("accessibilityStatus", if (GanzaAccessibilityService.isEnabled()) "ENABLED" else "WAITING_PERMISSION")
            putString("notificationStatus", if (GanzaNotificationListener.isEnabled()) "ENABLED" else "WAITING_PERMISSION")
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun executeAction(action: String, params: ReadableMap, promise: Promise) {
        // Hard rule: never fake success — check permission first
        when (action) {
            "tap", "click", "gesture" -> {
                if (!GanzaAccessibilityService.isEnabled()) {
                    promise.reject("WAITING_PERMISSION", "AccessibilityService not enabled. Grant via Settings → Accessibility → GANZA")
                    return
                }
                // Real implementation would dispatch gesture and verify
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("success", false)
                    putString("status", "NOT_IMPLEMENTED")
                    putString("reason", "Gesture execution requires active verification — stub returns NOT_IMPLEMENTED until verified on device")
                })
            }
            else -> promise.reject("NOT_SUPPORTED", "Action $action not supported on this OS/app")
        }
    }

    @ReactMethod
    fun getUITree(promise: Promise) {
        val svc = GanzaAccessibilityService.instance
        if (svc == null) {
            promise.reject("WAITING_PERMISSION", "Accessibility not enabled")
            return
        }
        promise.resolve(svc.getUITreeDump())
    }
}
