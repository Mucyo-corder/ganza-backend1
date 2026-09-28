package com.universalcounter.engine

import com.universalcounter.engine.model.CountOptions
import com.universalcounter.engine.scenes.LightingStyle
import com.universalcounter.engine.scenes.LayoutStyle
import com.universalcounter.engine.scenes.ObjectShape
import com.universalcounter.engine.scenes.SurfaceStyle
import com.universalcounter.engine.scenes.SyntheticScenes
import org.junit.Test

/**
 * Diagnostic: runs a handful of scenes and prints what the engine actually did.
 * Used while tuning thresholds - not an assertion test.
 */
class EngineDiagnosticTest : OpenCvTestBase() {

    private fun run(name: String, block: () -> com.universalcounter.engine.scenes.Scene) {
        val scene = block()
        val t0 = System.currentTimeMillis()
        val result = CountingEngine().count(scene.image, CountOptions.DEFAULT)
        val ms = System.currentTimeMillis() - t0
        val q = result.quality
        println(
            "%-28s expected=%3d detected=%3d err=%+3d tier=%-9s score=%.3f strat=%-22s split=%d/%d  %dms".format(
                name, scene.expectedCount, result.count, result.count - scene.expectedCount,
                q.tier, q.score, result.strategyChosen,
                result.objects.count { it.cameFromSplit }, result.count, ms
            )
        )
        println("      concerns: ${q.reasons.joinToString { it.name }.ifEmpty { "none" }}")
    }

    @Test
    fun diagnostic() {
        run("5 bricks clean") {
            SyntheticScenes.build("b5", 5, shape = ObjectShape.BRICK, layout = LayoutStyle.SCATTER, seed = 11)
        }
        run("10 bricks clean") {
            SyntheticScenes.build("b10", 10, shape = ObjectShape.BRICK, layout = LayoutStyle.SCATTER, seed = 12)
        }
        run("20 bricks grid") {
            SyntheticScenes.build("b20", 20, shape = ObjectShape.BRICK, layout = LayoutStyle.GRID, seed = 13)
        }
        run("50 bricks grid") {
            SyntheticScenes.build(
                "b50", 50, width = 1200, height = 900, shape = ObjectShape.BRICK,
                layout = LayoutStyle.GRID, objectSize = 40, seed = 14
            )
        }
        run("100 tiles grid") {
            SyntheticScenes.build(
                "t100", 100, width = 1300, height = 1000, shape = ObjectShape.ROUND_TILE,
                layout = LayoutStyle.GRID, objectSize = 34, seed = 15
            )
        }
        run("12 touching bricks") {
            SyntheticScenes.build(
                "touch12", 12, shape = ObjectShape.BRICK, layout = LayoutStyle.TOUCHING_ROWS,
                surface = SurfaceStyle.WHITE_SHEET, objectSize = 52, seed = 16
            )
        }
        run("16 pipes touching") {
            SyntheticScenes.build(
                "pipe16", 16, width = 1100, height = 700, shape = ObjectShape.PIPE,
                layout = LayoutStyle.TOUCHING_ROWS, surface = SurfaceStyle.WHITE_SHEET,
                objectSize = 46, seed = 17
            )
        }
        run("8 overlapping (must refuse)") {
            SyntheticScenes.build(
                "ov8", 8, shape = ObjectShape.BRICK, layout = LayoutStyle.OVERLAP, seed = 18
            )
        }
        run("30 wood planks") {
            SyntheticScenes.build(
                "wood30", 30, width = 1100, height = 800, shape = ObjectShape.PLANK,
                surface = SurfaceStyle.CONCRETE, layout = LayoutStyle.GRID, objectSize = 40, seed = 19
            )
        }
        run("24 cans on wood") {
            SyntheticScenes.build(
                "can24", 24, width = 1000, height = 800, shape = ObjectShape.CAN,
                surface = SurfaceStyle.WOOD, layout = LayoutStyle.GRID, objectSize = 38, seed = 20
            )
        }
        run("20 under side light") {
            SyntheticScenes.build(
                "side20", 20, shape = ObjectShape.BRICK, lighting = LightingStyle.SIDE_LIGHT,
                layout = LayoutStyle.GRID, seed = 21
            )
        }
        run("20 on sand dim") {
            SyntheticScenes.build(
                "sand20", 20, shape = ObjectShape.BRICK, surface = SurfaceStyle.SAND,
                lighting = LightingStyle.DIM, layout = LayoutStyle.GRID, seed = 22
            )
        }
        run("20 low contrast") {
            SyntheticScenes.build(
                "lowc20", 20, shape = ObjectShape.BRICK, surface = SurfaceStyle.CONCRETE,
                contrastAgainstSurface = 0.28, layout = LayoutStyle.GRID, seed = 23
            )
        }
        run("20 blurred") {
            SyntheticScenes.build(
                "blur20", 20, shape = ObjectShape.BRICK, layout = LayoutStyle.GRID, blurSigma = 5.0, seed = 24
            )
        }
        run("20 cropped") {
            SyntheticScenes.build(
                "crop20", 20, shape = ObjectShape.BRICK, layout = LayoutStyle.CROPPED, seed = 25
            )
        }
        run("40 mixed sizes") {
            SyntheticScenes.build(
                "mix40", 40, width = 1200, height = 900, shape = ObjectShape.BRICK,
                layout = LayoutStyle.SCATTER, sizeJitter = 0.35, seed = 26
            )
        }
    }
}
