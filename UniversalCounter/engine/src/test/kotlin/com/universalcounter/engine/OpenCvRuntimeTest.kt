package com.universalcounter.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfByte
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc

class OpenCvRuntimeTest {

    @Test
    fun nativeOpenCvIsUsable() {
        OpenCvRuntime.ensureLoaded()
        val m = Mat(4, 4, CvType.CV_8UC1)
        m.setTo(Scalar(7.0))
        val mean = Core.mean(m).`val`[0]
        assertEquals(7.0, mean, 1e-9)
        m.release()
    }

    @Test
    fun imgprocIsUsable() {
        OpenCvRuntime.ensureLoaded()
        val src = Mat(10, 10, CvType.CV_8UC1, Scalar(0.0))
        Imgproc.circle(src, Point(5.0, 5.0), 3, Scalar(255.0), -1)
        val dst = Mat()
        Imgproc.GaussianBlur(src, dst, Size(3.0, 3.0), 0.0)
        assertEquals(src.rows(), dst.rows())
        dst.release()
        src.release()
    }

    @Test
    fun imgcodecsIsUsable() {
        OpenCvRuntime.ensureLoaded()
        val img = Mat(8, 8, CvType.CV_8UC3, Scalar(10.0, 200.0, 30.0))
        val buf = MatOfByte()
        assertTrue(Imgcodecs.imencode(".png", img, buf))
        val dec = Imgcodecs.imdecode(buf, Imgcodecs.IMREAD_COLOR)
        assertEquals(8, dec.rows())
        assertEquals(8, dec.cols())
        dec.release()
        buf.release()
        img.release()
    }

    @Test
    fun morphologyAndContoursAreUsable() {
        OpenCvRuntime.ensureLoaded()
        val bin = Mat(40, 40, CvType.CV_8UC1, Scalar(0.0))
        Imgproc.rectangle(bin, Point(5.0, 5.0), Point(15.0, 15.0), Scalar(255.0), -1)
        Imgproc.rectangle(bin, Point(25.0, 25.0), Point(35.0, 35.0), Scalar(255.0), -1)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        Imgproc.morphologyEx(bin, bin, Imgproc.MORPH_OPEN, kernel)

        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(bin, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
        assertEquals(2, contours.size)
        contours.forEach { it.release() }
        hierarchy.release()
        kernel.release()
        bin.release()
    }
}
