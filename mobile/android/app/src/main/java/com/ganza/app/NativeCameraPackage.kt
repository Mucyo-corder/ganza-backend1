package com.ganza.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeCameraModule.NAME)
class NativeCameraModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "NativeCameraModule"
  }

  override fun getName(): String = NAME

  override fun getConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      "cameraPermission" to "android.permission.CAMERA",
      "storagePermission" to "android.permission.WRITE_EXTERNAL_STORAGE"
    )
  }
}

class NativeCameraPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(NativeCameraModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
