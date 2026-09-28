package com.universalcounter.engine

import com.universalcounter.engine.scenes.SyntheticScenes
import org.junit.Test
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

class ScratchDebugTest : OpenCvTestBase() {

    @Test
    fun debugConvertTo() {
        val scene = SyntheticScenes.build("b5", 5, seed = 11)
        val bgr = scene.image
        println("bgr: ${bgr.rows()}x${bgr.cols()} ch=${bgr.channels()} type=${bgr.type()}")

        val gray = Mat()
        Imgproc.cvtColor(bgr, gray, Imgproc.COLOR_BGR2GRAY)
        println("gray: ${gray.rows()}x${gray.cols()} ch=${gray.channels()} type=${gray.type()}")

        val illumination = Mat()
        val k = maxOf(15, (minOf(gray.rows(), gray.cols()) / 10) * 2 + 1)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, Size(k.toDouble(), k.toDouble()))
        Imgproc.morphologyEx(gray, illumination, Imgproc.MORPH_CLOSE, kernel)
        println("illumination: ${illumination.rows()}x${illumination.cols()} ch=${illumination.channels()} type=${illumination.type()}")

        val floor = Mat()
        Core.max(illumination, Scalar(18.0), floor)
        println("floor: ${floor.rows()}x${floor.cols()} ch=${floor.channels()} type=${floor.type()} empty=${floor.empty()}")

        val illum3 = Mat()
        floor.convertTo(illum3, CvType.CV_32FC3)
        println("illum3: ${illum3.rows()}x${illum3.cols()} ch=${illum3.channels()} type=${illum3.type()} empty=${illum3.empty()}")

        val bgrF = Mat()
        bgr.convertTo(bgrF, CvType.CV_32FC3)
        println("bgrF: ${bgrF.rows()}x${bgrF.cols()} ch=${bgrF.channels()} type=${bgrF.type()} empty=${bgrF.empty()}")
    }
}
