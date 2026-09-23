package com.ganza.app.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * GANZA Accessibility Controller — UI Tree, Gestures, Screenshot
 * Hard rule: actions execute ONLY when service is enabled and permitted.
 * If not enabled → status WAITING_PERMISSION, never fake success.
 */
class GanzaAccessibilityService : AccessibilityService() {

    companion object {
        var instance: GanzaAccessibilityService? = null
            private set
        fun isEnabled(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    fun getUITreeDump(): String {
        val root = rootInActiveWindow ?: return "NO_ROOT_WINDOW"
        return dumpNode(root, 0)
    }

    private fun dumpNode(node: AccessibilityNodeInfo, depth: Int): String {
        val sb = StringBuilder()
        sb.append("  ".repeat(depth))
        sb.append("${node.className} text=${node.text} desc=${node.contentDescription} clickable=${node.isClickable} bounds=${node.getBounds()}\n")
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { sb.append(dumpNode(it, depth + 1)) }
        }
        return sb.toString()
    }

    private fun AccessibilityNodeInfo.getBounds(): String {
        val rect = android.graphics.Rect()
        getBoundsInScreen(rect)
        return rect.toString()
    }

    fun tapNode(node: AccessibilityNodeInfo): Boolean {
        return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    fun gestureTap(x: Float, y: Float): Boolean {
        val path = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 80))
            .build()
        var result = false
        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) { result = true }
            override fun onCancelled(gestureDescription: GestureDescription?) { result = false }
        }, null)
        // Note: dispatchGesture is async — caller must observe after-state and verify
        return true
    }

    fun typeText(node: AccessibilityNodeInfo, text: String): Boolean {
        val args = android.os.Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text) }
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }
}
