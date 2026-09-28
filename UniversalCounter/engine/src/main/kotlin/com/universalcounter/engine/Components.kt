package com.universalcounter.engine

import com.universalcounter.engine.model.CountOptions
import com.universalcounter.engine.model.DetectedObject
import com.universalcounter.engine.model.RotatedBox
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * Turns a binary mask into candidate [DetectedObject]s, with real shape statistics
 * measured from the image.
 */
object Components {

    /**
     * Builds a [DetectedObject] from one contour.
     *
     * Every field is derived from the pixels: area from `contourArea`, axes from
     * `minAreaRect`, colour from the actual mean of the object's pixels.
     */
    fun describe(
        contour: MatOfPoint,
        id: Int,
        bgr: Mat,
        groupId: Int,
        cameFromSplit: Boolean = false,
        splitFactor: Int = 1
    ): DetectedObject? {
        val area = Imgproc.contourArea(contour)
        if (area <= 0.0) return null
        val perimeter = CvUtil.arcLengthOf(contour)
        if (perimeter <= 0.0) return null
        val pts = contour.toArray()
        if (pts.isEmpty()) return null

        val box = Imgproc.boundingRect(contour)
        val moments = Imgproc.moments(contour, true)
        val cx = if (moments.m00 > 1e-9) moments.m10 / moments.m00 else (box.x + box.width / 2.0)
        val cy = if (moments.m00 > 1e-9) moments.m01 / moments.m00 else (box.y + box.height / 2.0)

        val rr = CvUtil.minAreaRectOf(contour)
        val rotBox = RotatedBox(
            center = Point(rr.center.x, rr.center.y),
            width = rr.size.width,
            height = rr.size.height,
            angleDeg = rr.angle
        )

        val hullArea = CvUtil.convexHullArea(contour)
        val solidity = if (hullArea > 0) (area / hullArea).coerceIn(0.0, 1.0) else 1.0
        val rectArea = if (rotBox.area > 0) rotBox.area else (box.width.toDouble() * box.height.toDouble())
        val rectangularity = if (rectArea > 0) (area / rectArea).coerceIn(0.0, 1.0) else 0.0
        val circularity = if (perimeter > 0) {
            (4.0 * Math.PI * area / (perimeter * perimeter)).coerceIn(0.0, 1.0)
        } else 0.0

        val meanColor = meanColorOf(contour, bgr)
        val touches = touchesBorder(pts, bgr.cols(), bgr.rows())

        return DetectedObject(
            id = id,
            contour = pts.toList(),
            boundingBox = box,
            areaPx = area,
            perimeterPx = perimeter,
            centroid = Point(cx, cy),
            rotRect = rotBox,
            solidity = solidity,
            rectangularity = rectangularity,
            circularity = circularity,
            meanColor = meanColor,
            touchesBorder = touches,
            groupId = groupId,
            cameFromSplit = cameFromSplit,
            splitFactor = splitFactor
        )
    }

    /** Mean BGR of the pixels inside a contour, read from the real image. */
    fun meanColorOf(contour: MatOfPoint, bgr: Mat): DoubleArray {
        val mask = Mat.zeros(bgr.rows(), bgr.cols(), CvType.CV_8UC1)
        Imgproc.drawContours(mask, listOf(contour), -1, Scalar(255.0), -1)
        val mean = Core.mean(bgr, mask).`val`
        mask.release()
        return doubleArrayOf(
            if (mean.size > 0) mean[0] else 0.0,
            if (mean.size > 1) mean[1] else 0.0,
            if (mean.size > 2) mean[2] else 0.0
        )
    }

    private fun touchesBorder(pts: Array<Point>, w: Int, h: Int): Boolean {
        val margin = 2
        for (p in pts) {
            if (p.x <= margin || p.y <= margin || p.x >= w - 1 - margin || p.y >= h - 1 - margin) return true
        }
        return false
    }

    /**
     * Shortest distance in pixels between the borders of two objects.
     *
     * When the bounding boxes are disjoint this is a cheap box-to-box distance.
     * When they overlap it falls back to the true contour geometry via a distance
     * transform, so touching objects correctly report a gap of ~0.
     */
    fun gapBetween(a: DetectedObject, b: DetectedObject): Double {
        if (!CvUtil.rectsIntersect(a.boundingBox, b.boundingBox)) {
            return CvUtil.rectGap(a.boundingBox, b.boundingBox)
        }

        val left = minOf(a.boundingBox.x, b.boundingBox.x).toInt()
        val top = minOf(a.boundingBox.y, b.boundingBox.y).toInt()
        val right = maxOf(a.boundingBox.x + a.boundingBox.width, b.boundingBox.x + b.boundingBox.width).toInt()
        val bottom = maxOf(a.boundingBox.y + a.boundingBox.height, b.boundingBox.y + b.boundingBox.height).toInt()
        val w = maxOf(1, right - left + 1)
        val h = maxOf(1, bottom - top + 1)

        val mask = Mat.zeros(h, w, CvType.CV_8UC1)
        val dist = Mat()
        val ca = MatOfPoint(*a.contour.map { Point(it.x - left, it.y - top) }.toTypedArray())
        val cb = MatOfPoint(*b.contour.map { Point(it.x - left, it.y - top) }.toTypedArray())
        try {
            Imgproc.drawContours(mask, listOf(cb), -1, Scalar.all(255.0), -1)
            Imgproc.distanceTransform(mask, dist, Imgproc.DIST_L2, 3)
            var min = Double.MAX_VALUE
            for (p in ca.toArray()) {
                val x = p.x.toInt()
                val y = p.y.toInt()
                if (x < 0 || y < 0 || x >= dist.cols() || y >= dist.rows()) continue
                val v = dist.get(y, x)[0]
                if (v < min) min = v
            }
            return if (min == Double.MAX_VALUE) 0.0 else min
        } finally {
            ca.release(); cb.release(); dist.release(); mask.release()
        }
    }

    /**
     * Drops components that cannot be a real object: too small to be one (noise),
     * or with a shape so ragged that it is texture rather than an object.
     *
     * The area bounds are absolute; shape bounds are relative and product-agnostic.
     */
    fun filterByGeometry(objects: List<DetectedObject>, options: CountOptions): List<DetectedObject> =
        objects.filter { o ->
            o.areaPx >= options.minAreaPx &&
                o.areaPx <= options.maxAreaPx &&
                o.rectangularity > 0.18 &&
                o.solidity > 0.40
        }
}
