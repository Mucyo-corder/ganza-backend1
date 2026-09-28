package com.universalcounter.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
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
import com.universalcounter.engine.model.QualityTier
import org.opencv.android.Utils
import org.opencv.core.Mat
import java.io.File
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

        statusText.text = "Move closer • Improve lighting • Keep objects separated"
        captureButton.setOnClickListener { takePhoto() }

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
                        processCapturedPhoto(photoFile)
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
        try {
            val bitmap = android.graphics.BitmapFactory.decodeFile(photoFile.absolutePath) ?: run {
                Toast.makeText(this, "Unable to decode the captured photo.", Toast.LENGTH_LONG).show()
                return
            }
            val mat = Mat()
            Utils.bitmapToMat(bitmap, mat)
            val result = CountingEngine().count(mat, CountOptions.DEFAULT)
            val analysis = ProductAnalysisResult.fromCountingResult(result)
            val intent = Intent(this, ResultActivity::class.java).apply {
                putExtra("photo_path", photoFile.absolutePath)
                putExtra("count", analysis.quantity)
                putExtra("quality", analysis.quality)
                putExtra("status", if (analysis.requiresConfirmation) "PENDING_VERIFICATION" else "VERIFIED")
                putExtra("product_name", analysis.productName)
                putExtra("category", analysis.category)
                putExtra("detection_summary", analysis.detectionSummary)
                putExtra("requires_confirmation", analysis.requiresConfirmation)
                putExtra("quantity_status", analysis.quantityStatus)
                putExtra("confidence", analysis.confidence)
                putExtra("dimensions", analysis.dimensions)
                putExtra("user_action_hint", analysis.userActionHint)
                putExtra("market_status", "OFFLINE")
                putExtra("market_message", "Current online market price cannot be checked. Enter your own unit price or retake the photo for a better match.")
                putExtra("market_currency", "RWF")
                putStringArrayListExtra("characteristics", ArrayList(analysis.characteristics))
                putExtra("reason", result.quality.reasons.joinToString(" | ") { it.userMessage })
            }
            startActivity(intent)
        } catch (e: Exception) {
            Log.e("CameraActivity", "Counting failed", e)
            Toast.makeText(this, "COUNT NOT RELIABLE. Please retake the photo.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
