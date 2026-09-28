package com.universalcounter.engine

import com.universalcounter.engine.model.DetectedObject
import com.universalcounter.engine.model.ObjectGroup
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.sqrt

/**
 * Splits a scene into visually distinct object groups.
 *
 * This is purely statistical: size, aspect, elongation and colour. It is never an
 * attempt to guess what the products are called - naming is the user's job.
 *
 * The important property is that a split is only reported when the evidence is
 * strong, so the app asks the user to choose rather than silently adding two
 * populations of different things into one total.
 */
object GroupClustering {

    private const val MIN_GROUP_SIZE = 2

    /** Relative weight of each normalised feature in the distance metric. */
    private const val W_AREA = 0.45
    private const val W_ELONGATION = 0.20
    private const val W_ASPECT = 0.15
    private const val W_COLOUR = 0.20

    /**
     * Minimum normalised distance between two cluster centroids before the split
     * is considered a genuine difference in object type rather than camera noise.
     */
    private const val MIN_CENTROID_SEPARATION = 1.15

    /**
     * Clusters [objects] and returns groups ordered by descending size.
     *
     * @return a single group when no robust split exists, so callers never have to
     *         special-case the "all one product" situation.
     */
    fun cluster(objects: List<DetectedObject>, maxGroups: Int = 4): List<ObjectGroup> {
        if (objects.size < MIN_GROUP_SIZE * 2) return listOf(singleGroup(objects, 0))

        val features = objects.map { featureVector(it) }
        val normalised = normalise(features)
        val k = minOf(maxGroups, objects.size / MIN_GROUP_SIZE)
        if (k < 2) return listOf(singleGroup(objects, 0))

        val labels = kmeans(normalised, k)

        // Bucket objects by cluster, remembering which indices landed where.
        val indexGroups = ArrayList<MutableList<Int>>()
        for (c in 0 until k) {
            val idx = (0 until objects.size).filter { labels[it] == c }
            if (idx.size >= MIN_GROUP_SIZE) indexGroups.add(idx.toMutableList())
        }
        if (indexGroups.size < 2) return listOf(singleGroup(objects, 0))

        // A split is only credible when the cluster centroids are far apart in the
        // weighted feature space; otherwise it is just camera noise or a partial
        // object and we must not report two kinds of product.
        val centroids = indexGroups.map { idx -> centroidOf(idx.map { normalised[it] }) }
        var bestPairDistance = 0.0
        for (a in 0 until centroids.size) {
            for (b in a + 1 until centroids.size) {
                val d = distance(centroids[a], centroids[b])
                if (d > bestPairDistance) bestPairDistance = d
            }
        }
        if (bestPairDistance < MIN_CENTROID_SEPARATION) {
            return listOf(singleGroup(objects, 0))
        }

        return indexGroups
            .sortedByDescending { it.size }
            .mapIndexed { index, idx ->
                val objs = idx.map { objects[it].copy(groupId = index) }
                ObjectGroup(
                    id = index,
                    objects = objs,
                    label = "Group ${('A' + index)}",
                    medianAreaPx = Stats.median(objs.map { it.areaPx }),
                    medianAspect = Stats.median(objs.map { it.boundingAspect }),
                    medianElongation = Stats.median(objs.map { it.elongation })
                )
            }
    }

    /** True when the scene genuinely contains more than one kind of object. */
    fun isMultiGroup(groups: List<ObjectGroup>): Boolean = groups.size > 1

    private fun singleGroup(objects: List<DetectedObject>, id: Int): ObjectGroup {
        val objs = objects.map { it.copy(groupId = id) }
        return ObjectGroup(
            id = id,
            objects = objs,
            label = "Group A",
            medianAreaPx = Stats.median(objs.map { it.areaPx }),
            medianAspect = Stats.median(objs.map { it.boundingAspect }),
            medianElongation = Stats.median(objs.map { it.elongation })
        )
    }

    /**
     * Raw, unnormalised features.
     *
     * Aspect and elongation are made rotation-symmetric so that a stack of planks
     * laid at 90 degrees is still one group.
     */
    private fun featureVector(o: DetectedObject): DoubleArray {
        val area = ln(maxOf(1.0, o.areaPx))
        val elong = ln(maxOf(1.0, o.elongation))
        val w = maxOf(1.0, o.boundingBox.width.toDouble())
        val h = maxOf(1.0, o.boundingBox.height.toDouble())
        val shortOverLong = ln(minOf(w, h) / maxOf(w, h))
        // Chromaticity rather than raw brightness, so lighting changes do not
        // make identical objects look like different types.
        val b = o.meanColor.getOrElse(0) { 0.0 }
        val g = o.meanColor.getOrElse(1) { 0.0 }
        val r = o.meanColor.getOrElse(2) { 0.0 }
        val c1 = (b - r) / 255.0
        val c2 = (g - r) / 255.0
        return doubleArrayOf(area, elong, shortOverLong, c1, c2)
    }

    private val weights = doubleArrayOf(W_AREA, W_ELONGATION, W_ASPECT, W_COLOUR / 2.0, W_COLOUR / 2.0)

    /** Scales every feature to zero mean / unit variance, then applies weights. */
    private fun normalise(features: List<DoubleArray>): List<DoubleArray> {
        val n = features.size
        if (n == 0) return emptyList()
        val dim = features[0].size
        val out = ArrayList<DoubleArray>(n)
        val means = DoubleArray(dim)
        val sds = DoubleArray(dim)
        for (d in 0 until dim) {
            val col = features.map { it[d] }
            means[d] = Stats.mean(col)
            sds[d] = Stats.stdev(col).coerceAtLeast(1e-6)
        }
        for (f in features) {
            val v = DoubleArray(dim)
            for (d in 0 until dim) v[d] = (f[d] - means[d]) / sds[d] * weights[d]
            out.add(v)
        }
        return out
    }

    private fun distance(a: DoubleArray, b: DoubleArray): Double {
        var s = 0.0
        for (i in a.indices) {
            val d = a[i] - b[i]
            s += d * d
        }
        return sqrt(s)
    }

    private fun centroidOf(points: List<DoubleArray>): DoubleArray {
        if (points.isEmpty()) return DoubleArray(0)
        val c = DoubleArray(points[0].size)
        for (p in points) for (i in p.indices) c[i] += p[i]
        for (i in c.indices) c[i] /= points.size
        return c
    }

    /**
     * Deterministic k-means using maximin initialisation: seeds start at the most
     * extreme point, then repeatedly at the point furthest from all chosen seeds.
     * No randomness, so the same photo always produces the same grouping.
     */
    fun kmeans(points: List<DoubleArray>, k: Int, maxIterations: Int = 40): IntArray {
        val n = points.size
        if (n == 0) return IntArray(0)
        if (k <= 1) return IntArray(n) { 0 }

        val seeds = ArrayList<DoubleArray>()
        seeds.add(points[0])
        while (seeds.size < k) {
            var bestIdx = -1
            var bestDist = -1.0
            for (i in points.indices) {
                var nearest = Double.MAX_VALUE
                for (s in seeds) nearest = minOf(nearest, distance(points[i], s))
                if (nearest > bestDist) {
                    bestDist = nearest
                    bestIdx = i
                }
            }
            if (bestIdx < 0) break
            seeds.add(points[bestIdx])
        }
        val effectiveK = seeds.size

        var labels = IntArray(n) { 0 }
        for (iteration in 0 until maxIterations) {
            var changed = false
            for (i in points.indices) {
                var bestC = 0
                var bestD = Double.MAX_VALUE
                for (c in 0 until effectiveK) {
                    val d = distance(points[i], seeds[c])
                    if (d < bestD) {
                        bestD = d
                        bestC = c
                    }
                }
                if (labels[i] != bestC) {
                    labels[i] = bestC
                    changed = true
                }
            }
            for (c in 0 until effectiveK) {
                val members = points.filterIndexed { i, _ -> labels[i] == c }
                if (members.isNotEmpty()) seeds[c] = centroidOf(members)
            }
            if (!changed) break
        }
        return labels
    }

    /**
     * How inconsistent the object sizes are, 0..1. 1.0 means every object has
     * effectively the same area.
     */
    fun sizeConsistency(objects: List<DetectedObject>): Double {
        if (objects.isEmpty()) return 0.0
        if (objects.size == 1) return 1.0
        val mode = Stats.modeOfLog(objects.map { it.areaPx })
        return Stats.consistencyScore(objects.map { it.areaPx }, mode)
    }

    /**
     * Fraction of foreground pixels that sit in merged, crowded regions: components
     * much larger than the dominant single object. This is the measurable form of
     * "these objects are piled on top of each other".
     */
    fun overlappingRatio(objects: List<DetectedObject>): Double {
        if (objects.isEmpty()) return 0.0
        val totalArea = objects.sumOf { it.areaPx }
        if (totalArea <= 0) return 0.0
        val mode = Stats.modeOfLog(objects.map { it.areaPx })
        if (mode <= 0) return 0.0
        val crowded = objects.filter { it.areaPx > mode * 1.8 || it.cameFromSplit }
        val crowdedArea = crowded.sumOf { it.areaPx }
        return (crowdedArea / totalArea).coerceIn(0.0, 1.0)
    }
}
