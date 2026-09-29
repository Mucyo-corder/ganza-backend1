package com.universalcounter.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.universalcounter.app.R
import com.universalcounter.app.cv.OpenCvAndroidRuntime
import com.universalcounter.engine.CountingEngine
import com.universalcounter.engine.model.CountOptions
import org.opencv.android.Utils
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {
    private lateinit var previewView: PreviewView
    private lateinit var statusText: TextView
    private lateinit var captureButton: Button
    private lateinit var outputDirectory: File
    private lateinit var cameraExecutor: ExecutorService
    private var imageCapture: ImageCapture? = null
    private var pendingPhotoUri: Uri? = null

    private val requestCameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startCamera() else {
            Toast.makeText(this, "Camera permission is required for real counting.", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)
        OpenCvAndroidRuntime.initialise(this)

        previewView = findViewById(R.id.previewView)
        statusText = findViewById(R.id.statusText)
        captureButton = findViewById(R.id.captureButton)
        outputDirectory = File(getExternalFilesDir(null), "Pictures")
        if (!outputDirectory.exists()) outputDirectory.mkdirs()
        cameraExecutor = Executors.newSingleThreadExecutor()

        statusText.text = "Ready • take a photo to start the automatic scan"
        captureButton.setOnClickListener {
            statusText.text = "Analyzing product..."
            Handler(Looper.getMainLooper()).postDelayed({ statusText.text = "Identifying product..." }, 500)
            Handler(Looper.getMainLooper()).postDelayed({ statusText.text = "Searching current prices..." }, 1100)
            Handler(Looper.getMainLooper()).postDelayed({ statusText.text = "Preparing result..." }, 1800)
            takePhoto()
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
            imageCapture = ImageCapture.Builder().setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build()
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture)
            } catch (exc: Exception) {
                Log.e("CameraActivity", "Use case binding failed", exc)
                Toast.makeText(this, "Unable to start camera preview.", Toast.LENGTH_LONG).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun takePhoto() {
        val imageCapture = imageCapture ?: return
        val photoFile = File(outputDirectory, "counter_${System.currentTimeMillis()}.jpg")
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        imageCapture.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    val photoUri = FileProvider.getUriForFile(
                        this@CameraActivity,
                        "${applicationContext.packageName}.provider",
                        photoFile
                    )
                    pendingPhotoUri = photoUri
                    runOnUiThread {
                        statusText.text = "Processing image locally with Computer Vision"
                        cameraExecutor.execute { processCapturedPhoto(photoFile) }
                    }
                }

                override fun onError(exc: ImageCaptureException) {
                    runOnUiThread {
                        Toast.makeText(this@CameraActivity, "Photo capture failed. Please retake.", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    private fun processCapturedPhoto(photoFile: File) {
        var captured = Mat()
        try {
            val bitmap = android.graphics.BitmapFactory.decodeFile(photoFile.absolutePath) ?: run {
                openManualRecovery(photoFile, "Captured image could not be decoded", PhotoQualityStatus.INVALID)
                return
            }
            val rgba = Mat()
            Utils.bitmapToMat(bitmap, rgba)
            bitmap.recycle()
            if (rgba.channels() == 4) {
                Imgproc.cvtColor(rgba, captured, Imgproc.COLOR_RGBA2BGR)
            } else {
                rgba.copyTo(captured)
            }
            rgba.release()

            val photoQuality = PhotoQualityAssessment.assess(captured)
            val overlayFile = File(outputDirectory, "${photoFile.nameWithoutExtension}_overlay.png")
            val automaticCount: Int
            val overlayPath: String
            val analysis: ProductAnalysisResult
            val scanResult: ProductScanResult

            if (photoQuality.status == PhotoQualityStatus.INVALID) {
                automaticCount = 0
                overlayPath = ""
                analysis = ProductAnalysisResult(
                    quality = "NEEDS_REVIEW",
                    detectionSummary = "IFOTO NTIYAKORESHWA. Gerageza gufata ifoto ifite urumuri ruri neza kandi ibintu bigaragara.",
                    userActionHint = "You can enter a count and physical measurements manually, or retake the photo."
                )
                scanResult = ProductScanPipeline.fallback("General product", 0, "MODEL_NOT_VERIFIED")
            } else {
                val result = CountingEngine().count(captured, CountOptions.DEFAULT)
                automaticCount = result.count
                analysis = ProductAnalysisResult.fromCountingResult(result)
                scanResult = ProductScanPipeline.execute(this@CameraActivity, photoFile)
                overlayPath = try {
                    val overlayBitmap = android.graphics.Bitmap.createBitmap(
                        result.overlayImage.cols(),
                        result.overlayImage.rows(),
                        android.graphics.Bitmap.Config.ARGB_8888
                    )
                    Utils.matToBitmap(result.overlayImage, overlayBitmap)
                    FileOutputStream(overlayFile).use { stream ->
                        overlayBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                    }
                    overlayBitmap.recycle()
                    overlayFile.absolutePath
                } catch (overlayError: Exception) {
                    Log.w("CameraActivity", "Unable to save detection overlay", overlayError)
                    ""
                }
                result.strategyCandidates.forEach { it.mask.release() }
                result.workingImage.release()
                result.overlayImage.release()
            }

            val intent = Intent(this, ResultActivity::class.java).apply {
                putExtra("photo_path", photoFile.absolutePath)
                putExtra("count", analysis.quantity)
                putExtra("automatic_count", automaticCount)
                putExtra("quality", if (photoQuality.status == PhotoQualityStatus.NEEDS_REVIEW) "NEEDS_REVIEW" else scanResult.detectionQuality)
                putExtra("photo_status", photoQuality.status.name)
                putExtra("status", scanResult.verificationStatus)
                putExtra("product_name", scanResult.productName)
                putExtra("category", scanResult.category)
                putExtra("brand", scanResult.brand)
                putExtra("model", scanResult.model)
                putExtra("variant", scanResult.variant)
                putExtra("color", scanResult.color)
                putExtra("material", scanResult.material)
                putExtra("condition", scanResult.condition)
                putExtra("detection_summary", scanResult.specificationSummary)
                putExtra("requires_confirmation", scanResult.identificationStatus != "VERIFIED")
                putExtra("quantity_status", if (scanResult.quantity > 0) "DETECTED" else "COUNT_REQUIRES_VERIFICATION")
                putExtra("confidence", scanResult.detectionQuality.toDoubleOrNull() ?: analysis.confidence)
                putExtra("overlay_path", overlayPath)
                putExtra("user_action_hint", scanResult.specificationSummary)
                putExtra("market_status", scanResult.marketStatus)
                putExtra("market_message", scanResult.priceMessage)
                putExtra("market_currency", scanResult.currency)
                putExtra("unit_price", scanResult.unitPrice ?: 0.0)
                putExtra("reference_price", scanResult.referencePrice)
                putExtra("price_checked_at", scanResult.priceCheckedAt)
                putExtra("product_status", scanResult.identificationStatus)
                putExtra("dimensions", scanResult.dimensions)
                putStringArrayListExtra("characteristics", ArrayList(listOf(scanResult.specificationSummary, scanResult.dimensions)))
                putExtra("reason", scanResult.logs.joinToString("\n"))
            }
            runOnUiThread { startActivity(intent) }
        } catch (e: Exception) {
            Log.e("CameraActivity", "Counting failed", e)
            openManualRecovery(
                photoFile,
                "Automatic detection needs review. Enter the count manually or retake the photo.",
                statusAfterAnalysisFailure(imageDecoded = !captured.empty())
            )
        } finally {
            captured.release()
        }
    }

    private fun openManualRecovery(photoFile: File, message: String, photoStatus: PhotoQualityStatus) {
        val intent = Intent(this, ResultActivity::class.java).apply {
            putExtra("photo_path", photoFile.absolutePath)
            putExtra("count", 0)
            putExtra("automatic_count", 0)
            putExtra("quality", "NEEDS_REVIEW")
            putExtra("photo_status", photoStatus.name)
            putExtra("status", "PENDING_VERIFICATION")
            putExtra("product_name", "General product")
            putExtra("category", "General")
            putExtra("brand", "NOT VERIFIED")
            putExtra("model", "NOT VERIFIED")
            putExtra("condition", "Unknown")
            putExtra("detection_summary", message)
            putExtra("user_action_hint", "Enter the count and any measurements you took, or retake the photo.")
            putExtra("market_status", "CURRENT ONLINE PRICE: NOT AVAILABLE")
            putExtra("market_message", "Current online pricing could not be checked because no verified internet source is available.")
            putExtra("market_currency", "RWF")
            putExtra("product_status", "MODEL_NOT_VERIFIED")
            putExtra("dimensions", "Dimensions: NOT VERIFIED")
        }
        runOnUiThread { startActivity(intent) }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
