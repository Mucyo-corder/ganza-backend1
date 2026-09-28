package com.universalcounter.app.cv

import android.content.Context
import android.util.Log
import com.universalcounter.engine.OpenCvRuntime
import org.opencv.android.OpenCVLoader

/**
 * Loads the OpenCV native runtime that ships inside the `org.opencv:opencv` AAR.
 *
 * Everything after this point is pure computer vision running on-device: no network,
 * no model download, no inference server.
 */
object OpenCvAndroidRuntime {
    private const val TAG = "OpenCvAndroid"

    @Volatile
    private var initialised = false

    fun initialise(context: Context) {
        if (initialised) return
        synchronized(this) {
            if (initialised) return
            if (!OpenCVLoader.initDebug()) {
                error("OpenCV failed to initialise on this device.")
            }
            Log.i(TAG, "OpenCV runtime ready")
            // Prove the native library is usable before we claim the engine can run.
            OpenCvRuntime.probeNative()
            initialised = true
        }
    }

    fun isReady(): Boolean = initialised
}
