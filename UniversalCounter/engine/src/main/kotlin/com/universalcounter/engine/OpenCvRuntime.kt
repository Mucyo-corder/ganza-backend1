package com.universalcounter.engine

import org.opencv.core.Mat

/**
 * Locates the native OpenCV runtime. On Android this is called by the app (which uses
 * `org.opencv.android.OpenCVLoader`); in JVM unit tests it uses the desktop build.
 */
object OpenCvRuntime {
    @Volatile
    private var loaded = false

    fun ensureLoaded() {
        if (loaded) return
        synchronized(this) {
            if (loaded) return
            if (!load()) {
                throw IllegalStateException(
                    "OpenCV native runtime could not be loaded. " +
                        "On Android this means the OpenCV AAR was not packaged correctly."
                )
            }
            loaded = true
        }
    }

    private fun load(): Boolean = try {
        // Pure-JVM path (unit tests). The Android path is handled in OpenCvAndroidRuntime.
        Class.forName("nu.pattern.OpenCV").getMethod("loadLocally").invoke(null)
        true
    } catch (_: Throwable) {
        false
    }

    fun isLoaded(): Boolean = loaded

    /**
     * Loads the runtime only if nothing else has already done so.
     *
     * On Android `OpenCvAndroidRuntime` loads the native library first, so this is
     * a no-op there. In JVM unit tests it performs the desktop load.
     */
    fun ensureLoadedOnDemand() {
        if (loaded) return
        ensureLoaded()
    }

    /**
     * Verifies that the native OpenCV library is really loaded and callable.
     * On Android the runtime is loaded by `org.opencv.android.OpenCVLoader` beforehand,
     * so this only exercises native code.
     */
    fun probeNative() {
        val m = Mat(2, 2, org.opencv.core.CvType.CV_8UC1)
        m.setTo(org.opencv.core.Scalar(3.0))
        val mean = org.opencv.core.Core.mean(m).`val`[0]
        m.release()
        check(mean == 3.0) { "OpenCV native probe returned unexpected value: $mean" }
    }

    /** Proves the native library is really usable, not merely on the classpath. */
    fun selfTest(): Mat {
        ensureLoaded()
        probeNative()
        return Mat(1, 1, org.opencv.core.CvType.CV_8UC1)
    }
}
