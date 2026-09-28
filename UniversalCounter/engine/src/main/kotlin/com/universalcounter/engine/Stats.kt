package com.universalcounter.engine

import kotlin.math.abs
import kotlin.math.ln
import kotlin.math.sqrt

/** Small deterministic statistics helpers used across the pipeline. */
object Stats {

    fun median(values: List<Double>): Double {
        if (values.isEmpty()) return 0.0
        val s = values.sorted()
        val n = s.size
        return if (n % 2 == 1) s[n / 2] else (s[n / 2 - 1] + s[n / 2]) / 2.0
    }

    fun percentile(values: List<Double>, p: Double): Double {
        if (values.isEmpty()) return 0.0
        val s = values.sorted()
        val idx = ((s.size - 1) * p.coerceIn(0.0, 1.0)).toInt()
        return s[idx]
    }

    fun mean(values: List<Double>): Double =
        if (values.isEmpty()) 0.0 else values.sum() / values.size

    /** Sample standard deviation. */
    fun stdev(values: List<Double>): Double {
        if (values.size < 2) return 0.0
        val m = mean(values)
        val v = values.sumOf { (it - m) * (it - m) } / (values.size - 1)
        return sqrt(v)
    }

    /** Coefficient of variation - scale-free, so it works across object sizes. */
    fun coefficientOfVariation(values: List<Double>): Double {
        val m = mean(values)
        if (m <= 1e-9) return 0.0
        return stdev(values) / m
    }

    /**
     * Smoothed mode of log(values), returned in the original units.
     *
     * Object areas cluster tightly around a single value; a mode over log-area
     * finds that cluster robustly even when a few merged blobs sit far out in
     * the tail.
     */
    fun modeOfLog(values: List<Double>, bins: Int = 48): Double {
        if (values.isEmpty()) return 0.0
        if (values.size == 1) return values[0]
        val logs = values.filter { it > 0.0 }.map { ln(it) }
        if (logs.isEmpty()) return 0.0
        val lo = logs.min()
        val hi = logs.max()
        if (hi - lo < 1e-9) return values[0]
        val step = (hi - lo) / bins
        if (step <= 0.0) return values[0]
        val hist = IntArray(bins)
        for (v in logs) {
            val b = (((v - lo) / step).toInt()).coerceIn(0, bins - 1)
            hist[b]++
        }
        // Circular-ish smoothing so a value on a bin edge does not win by luck.
        val smoothed = IntArray(bins)
        for (i in 0 until bins) {
            var acc = 0
            for (d in -1..1) acc += hist[(i + d + bins) % bins]
            smoothed[i] = acc
        }
        var bestIdx = 0
        for (i in 1 until bins) if (smoothed[i] > smoothed[bestIdx]) bestIdx = i
        // Centre of the winning bin, in log space, back to linear units.
        val centre = lo + (bestIdx + 0.5) * step
        return kotlin.math.exp(centre)
    }

    /**
     * 0..1 score describing how tightly values cluster around their mode.
     * 1.0 == every value identical.
     */
    fun consistencyScore(values: List<Double>, mode: Double): Double {
        if (values.size < 2) return 0.5
        if (mode <= 1e-9) return 0.0
        // Work in log space so a 2x spread counts the same as a 2x shrink.
        val spread = values.filter { it > 0.0 }.map { abs(ln(it / mode)) }
        if (spread.isEmpty()) return 0.0
        val mad = median(spread)
        // mad == 0 -> identical. 0.7 in log space -> ~2x spread.
        return (1.0 - mad / 0.7).coerceIn(0.0, 1.0)
    }

    /** Index of the value closest to [target]. */
    fun nearestIndex(values: List<Double>, target: Double): Int {
        var best = 0
        var bestDist = Double.MAX_VALUE
        for (i in values.indices) {
            val d = abs(values[i] - target)
            if (d < bestDist) {
                bestDist = d
                best = i
            }
        }
        return best
    }
}
