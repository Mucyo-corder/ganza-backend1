package com.ganza.app.notifications

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * NotificationListener — Event Engine source: notification.received
 * Only operates when user enables notification access.
 */
class GanzaNotificationListener : NotificationListenerService() {
    companion object {
        var instance: GanzaNotificationListener? = null
            private set
        fun isEnabled(): Boolean = instance != null
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        val pkg = sbn.packageName
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        // Forward to JS bridge via event bus (to be implemented via React Native bridge)
        // For now, log — real would emit to JS EventBus
        android.util.Log.i("GanzaNotification", "[$pkg] $title: $text")
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}
