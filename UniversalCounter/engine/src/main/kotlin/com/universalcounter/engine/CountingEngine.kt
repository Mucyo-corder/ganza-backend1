package com.universalcounter.engine

import com.universalcounter.engine.model.CountOptions
import com.universalcounter.engine.model.CountResult
import com.universalcounter.engine.model.DetectedObject
import com.universalcounter.engine.model.ObjectGroup
import com.universalcounter.engine.model.QualityFactors
import com.universalcounter.engine.model.StrategyOutcome
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * The universal object counting engine.
 *
 * Deliberately built from classical, deterministic computer vision only:
 * preprocessing, perspective correction, lighting normalisation, several
 * independent segmentations, morphological cleanup, contour and connected-component
 * analysis, distance-transform watershed separation and geometric filtering.
 *
 * There is no neural network anywhere in this path, no network access, and no
 * language model. The count is a measurement of the photograph, and the quality
 * score is a weighted sum of image statistics that can be inspected and audited.
 */
class CountingEngine {

    /**
     * Counts the objects visible in [bgr].
     *
     * @param bgr a 3-channel BGR image, normally the raw CameraX capture
     * @return a result that may legitimately contain zero objects and an
     *         UNRELIABLE quality tier - refusing to count is a valid outcome
     */
    fun count(bgr: Mat, options: CountOptions = CountOptions.DEFAULT): CountResult {
        OpenCvRuntime.ensureLoadedOnDemand()

        val working = preprocess(bgr, options)
        val gray = Mat()
        Imgproc.cvtColor(working, gray, Imgproc.COLOR_BGR2GRAY)

        val trace = StringBuilder()

        // ---- 1. run every independent segmentation strategy --------------------
        val masks = Segmentation.buildAll(working, gray)
        val outcomes = ArrayList<StrategyOutcome>()

        for (sm in masks) {
            val rawContours = CvUtil.externalContours(sm.mask)
            val rawCount = rawContours.size
            rawContours.forEach { it.release() }

            // How well does this mask's boundary follow the photo's real edges?
            val alignment = Segmentation.edgeAlignment(sm.mask, gray)
            val fgRatio = sm.foregroundRatio()

            // A mask covering 2% or 90% of the frame is not a usable segmentation.
            val plausibility = when {
                fgRatio <= 0.005 -> 0.0
                fgRatio >= 0.92 -> 0.05
                fgRatio < 0.02 -> 0.35
                fgRatio > 0.75 -> 0.4
                else -> 1.0
            }
            val score = (0.62 * alignment + 0.38 * plausibility).coerceIn(0.0, 1.0)

            outcomes.add(
                StrategyOutcome(
                    name = sm.name,
                    mask = sm.mask,
                    objectCount = rawCount,
                    score = score,
                    foregroundRatio = fgRatio,
                    rawComponentCount = rawContours.size
                )
            )
        }

        if (outcomes.isEmpty()) {
            return emptyResult(working, "No segmentation strategy could run on this image")
        }

        // ---- 2. pick the strategy that best explains the photograph ------------
        val chosen = outcomes.maxByOrNull { it.score }!!
        trace.appendLine("SEGMENTATION")
        outcomes.forEach {
            trace.appendLine(
                "  %-24s score=%.3f  fg=%.4f  components=%d%s"
                    .format(it.name, it.score, it.foregroundRatio, it.objectCount,
                        if (it === chosen) "   <-- chosen" else "")
            )
        }
        val edgeAlignment = Segmentation.edgeAlignment(chosen.mask, gray)

        // ---- 3. components, geometry filtering ---------------------------------
        val contours = CvUtil.externalContours(chosen.mask)
        val candidates = ArrayList<DetectedObject>()
        var id = 0
        for (c in contours) {
            val o = Components.describe(c, id++, working, groupId = 0)
            if (o != null) candidates.add(o)
        }
        val filtered = Components.filterByGeometry(candidates, options)
        trace.appendLine(
            "  components: ${contours.size} raw -> ${filtered.size} after geometry filter"
        )

        // ---- 4. separation of touching objects ----------------------------------
        val separation = separateTouching(filtered, chosen.mask, working, options, trace)

        // ---- 5. groups ---------------------------------------------------------
        val finalGroups: List<ObjectGroup> = if (options.detectGroups) {
            GroupClustering.cluster(separation.objects)
        } else {
            listOf(GroupClustering.cluster(separation.objects, maxGroups = 1).first())
        }
        // Re-number after grouping so overlay indices match the group labels.
        val ordered = finalGroups.flatMap { it.objects }
        val objects = ordered.mapIndexed { i, o -> o.copy(id = i) }
        val regrouped = finalGroups.mapIndexed { gi, g ->
            g.copy(objects = objects.filter { it.groupId == gi })
        }

        // ---- 6. quality --------------------------------------------------------
        val agreement = QualityScorer.strategyAgreement(outcomes.associate { it.name to it.objectCount })
        val geometryConsistency = QualityScorer.geometryConsistency(objects)
        val separationConfidence = QualityScorer.separationConfidence(objects)
        val truncation = QualityScorer.borderTruncation(objects)
        val overlapping = GroupClustering.overlappingRatio(objects)
        val gap = if (objects.size >= 2) ObjectSeparation.separationRatio(objects) else 1.0

        val factors = ImageQuality.factorsFrom(
            gray = gray,
            borderTruncationRatio = truncation,
            separationConfidence = separationConfidence,
            geometryConsistency = geometryConsistency,
            strategyAgreement = agreement,
            overlappingRatio = overlapping,
            minSeparationGapRatio = gap
        )

        val quality = QualityScorer.score(
            objects = objects,
            factors = factors,
            groups = finalGroups,
            options = options,
            ambiguousSplits = separation.ambiguousCount
        )

        trace.appendLine("QUALITY INPUTS")
        trace.appendLine("  strategyAgreement=$agreement  geometryConsistency=$geometryConsistency")
        trace.appendLine("  separationConfidence=$separationConfidence  minGapRatio=$gap")
        trace.appendLine("  borderTruncation=$truncation  overlappingRatio=$overlapping")
        trace.appendLine("  ambiguousSplits=${separation.ambiguousCount}")
        trace.appendLine(quality.explain())

        val overlay = OverlayRenderer.render(working, objects, finalGroups, quality.tier)

        return CountResult(
            objects = objects,
            groups = regrouped,
            quality = quality,
            workingImage = working,
            overlayImage = overlay,
            strategyChosen = chosen.name,
            strategyCandidates = outcomes,
            pipelineTrace = trace.toString()
        )
    }

    /**
     * Downscales, crops to the ROI and flattens the shooting surface.
     *
     * The returned Mat is the "working image" that all object coordinates refer to.
     */
    private fun preprocess(bgr: Mat, options: CountOptions): Mat {
        var img = bgr.clone()

        options.roi?.let { roi ->
            val r = Rect(
                roi.x.coerceIn(0, maxOf(0, img.cols() - 1)),
                roi.y.coerceIn(0, maxOf(0, img.rows() - 1)),
                roi.width.coerceIn(1, img.cols()),
                roi.height.coerceIn(1, img.rows())
            )
            val safeW = minOf(r.width, img.cols() - r.x)
            val safeH = minOf(r.height, img.rows() - r.y)
            if (safeW > 8 && safeH > 8) {
                val cropped = img.submat(Rect(r.x, r.y, safeW, safeH)).clone()
                img.release()
                img = cropped
            }
        }

        val maxDim = maxOf(img.rows(), img.cols())
        if (maxDim > options.maxWorkingDimension) {
            val scale = options.maxWorkingDimension.toDouble() / maxDim
            val resized = Mat()
            Imgproc.resize(
                img, resized,
                org.opencv.core.Size((img.cols() * scale).roundToInt().toDouble(), (img.rows() * scale).roundToInt().toDouble()),
                0.0, 0.0, Imgproc.INTER_AREA
            )
            img.release()
            img = resized
        }

        if (img.channels() == 1) {
            val bgr = Mat()
            Imgproc.cvtColor(img, bgr, Imgproc.COLOR_GRAY2BGR)
            img.release()
            img = bgr
        }

        val normalised = Segmentation.normalizeLighting(img)
        img.release()
        return normalised
    }

    private class SeparationOutcome(
        val objects: List<DetectedObject>,
        val ambiguousCount: Int
    )

    /**
     * Splits merged blobs, but only accepts a split whose pieces really look like
     * whole objects of the size seen elsewhere in the photo.
     */
    private fun separateTouching(
        objects: List<DetectedObject>,
        mask: Mat,
        working: Mat,
        options: CountOptions,
        trace: StringBuilder
    ): SeparationOutcome {
        if (objects.isEmpty()) return SeparationOutcome(emptyList(), 0)

        // The dominant single-object area, learned from the photo itself.
        val referenceArea = Stats.modeOfLog(objects.map { it.areaPx })
        trace.appendLine("SEPARATION")
        trace.appendLine("  dominant object area (mode) = %.0f px".format(referenceArea))

        val result = ArrayList<DetectedObject>()
        var ambiguous = 0
        var splitCount = 0

        for (o in objects) {
            val ratio = if (referenceArea > 0) o.areaPx / referenceArea else 1.0
            // A blob more than ~1.6x the typical object is a candidate merge.
            if (ratio <= 1.6) {
                result.add(o)
                continue
            }
            val expectedPieces = ratio.roundToInt().coerceAtLeast(2)

            val blobMask = Mat.zeros(mask.rows(), mask.cols(), CvType.CV_8UC1)
            Imgproc.drawContours(blobMask, listOf(MatOfPoint(*o.contour.toTypedArray())), -1, Scalar(255.0), -1)

            val attempt = ObjectSeparation.split(blobMask, working, referenceArea, options)
            blobMask.release()

            if (attempt.pieces.isEmpty()) {
                // Could not separate it at all: report it as-is but count the event.
                result.add(o)
                ambiguous++
                trace.appendLine("  blob #${o.id + 1} (${"%.0f".format(o.areaPx)}px, ~${expectedPieces} objects): NO SPLIT FOUND")
                continue
            }

            if (attempt.ambiguous) {
                ambiguous++
                result.add(o)
                trace.appendLine(
                    "  blob #${o.id + 1} (${"%.0f".format(o.areaPx)}px): split into %d pieces but confidence %.2f < tolerance - UNRELIABLE"
                        .format(attempt.pieces.size, attempt.confidence)
                )
                attempt.release()
                continue
            }

            var added = 0
            for (piece in attempt.pieces) {
                val pieceArea = Imgproc.contourArea(piece)
                if (pieceArea < options.minAreaPx) {
                    piece.release()
                    continue
                }
                val described = Components.describe(
                    piece, result.size, working, groupId = 0, cameFromSplit = true, splitFactor = attempt.pieces.size
                )
                piece.release()
                if (described != null) {
                    result.add(described)
                    added++
                }
            }
            if (added == 0) {
                result.add(o)
            } else {
                splitCount++
                trace.appendLine(
                    "  blob #${o.id + 1} (${"%.0f".format(o.areaPx)}px): split into %d objects via %s (confidence %.2f)"
                        .format(added, attempt.method, attempt.confidence)
                )
            }
            attempt.release()
        }

        if (splitCount > 0) trace.appendLine("  merged blobs separated: $splitCount")
        return SeparationOutcome(result.mapIndexed { i, o -> o.copy(id = i) }, ambiguous)
    }

    private fun emptyResult(working: Mat, note: String): CountResult {
        val quality = com.universalcounter.engine.model.QualityReport(
            tier = com.universalcounter.engine.model.QualityTier.UNRELIABLE,
            score = 0.0,
            perFactor = emptyMap(),
            reasons = listOf(com.universalcounter.engine.model.FailureReason.NO_OBJECTS_DETECTED),
            blockingReasons = listOf(com.universalcounter.engine.model.FailureReason.NO_OBJECTS_DETECTED),
            measured = QualityFactors.NEUTRAL
        )
        return CountResult(
            objects = emptyList(),
            groups = emptyList(),
            quality = quality,
            workingImage = working,
            overlayImage = working.clone(),
            strategyChosen = note,
            strategyCandidates = emptyList()
        )
    }
}
