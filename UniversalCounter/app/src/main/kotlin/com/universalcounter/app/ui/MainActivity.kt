package com.universalcounter.app.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.universalcounter.app.R

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        findViewById<Button>(R.id.takePhotoButton).setOnClickListener {
            startActivity(Intent(this, CameraActivity::class.java))
        }

        findViewById<Button>(R.id.countStockButton).setOnClickListener {
            startActivity(Intent(this, StockActivity::class.java))
        }

        findViewById<Button>(R.id.valueButton).setOnClickListener {
            startActivity(Intent(this, ValueActivity::class.java))
        }

        findViewById<Button>(R.id.historyButton).setOnClickListener {
            startActivity(Intent(this, HistoryActivity::class.java))
        }
    }
}
