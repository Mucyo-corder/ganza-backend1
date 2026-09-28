package com.universalcounter.engine

import org.junit.BeforeClass

/**
 * Loads the native OpenCV library once for the whole test JVM.
 *
 * Without this, the first `Mat()` allocation throws UnsatisfiedLinkError, because
 * no OpenCV Java object may be constructed before the native runtime is up.
 */
abstract class OpenCvTestBase {

    companion object {
        @JvmStatic
        @BeforeClass
        fun loadNativeOpenCv() {
            OpenCvRuntime.ensureLoaded()
            check(OpenCvRuntime.isLoaded()) { "OpenCV native runtime failed to load" }
            // Fail loudly now rather than mysteriously inside a pipeline test.
            OpenCvRuntime.probeNative()
        }
    }
}
