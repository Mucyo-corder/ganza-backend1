package com.universalcounter.engine.scenes

import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgcodecs.Imgcodecs
import java.awt.BasicStroke
import java.awt.Color
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.geom.Ellipse2D
import java.awt.geom.GeneralPath
import java.awt.geom.Line2D
import java.awt.geom.Rectangle2D
import java.awt.geom.RoundRectangle2D
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/** What the surface the goods sit on looks like. */
enum class SurfaceStyle { CONCRETE, SAND, WOOD, TILE, FABRIC, WHITE_SHEET }

/** How the scene is lit. */
enum class LightingStyle { UNIFORM, VIGNETTE, SIDE_LIGHT, DIM, HOT_SPOT }

/** How objects are arranged. */
enum class LayoutStyle { GRID, SCATTER, TOUCHING_ROWS, TOUCHING_HEX, OVERLAP, CROPPED }

/** Shape of an individual object. */
enum class ObjectShape { BRICK, ROUND_TILE, PIPE, PLANK, POLYGON, CAN }

/** A scene definition plus the ground truth needed to score the engine. */
data class Scene(
    val name: String,
    val image: Mat,
    /** Objects the engine is expected to report. */
    val expectedCount: Int,
    /** Objects drawn that are cut off by the frame edge. */
    val croppedCount: Int = 0,
    /** True when the scene deliberately hides objects behind others. */
    val hasOverlap: Boolean = false,
    /** True when objects are meant to be touching. */
    val hasTouching: Boolean = false,
    val description: String = ""
)

/**
 * Builds deterministic, photo-like test scenes with known ground truth.
 *
 * The point is to make the engine's job realistic rather than trivial: the
 * surfaces are textured, the objects are shaded, the lighting is uneven and there
 * is sensor noise. A counter that only works on flat masks is not a counter.
 */
object SyntheticScenes {

    fun build(
        name: String,
        count: Int,
        width: Int = 900,
        height: Int = 700,
        surface: SurfaceStyle = SurfaceStyle.CONCRETE,
        lighting: LightingStyle = LightingStyle.UNIFORM,
        layout: LayoutStyle = LayoutStyle.SCATTER,
        shape: ObjectShape = ObjectShape.BRICK,
        objectSize: Int = 46,
        sizeJitter: Double = 0.0,
        noise: Double = 6.0,
        contrastAgainstSurface: Double = 1.0,
        blurSigma: Double = 0.0,
        seed: Long = 1234L
    ): Scene {
        val rnd = Random(seed)
        currentShape = shape
        val img = BufferedImage(width, height, BufferedImage.TYPE_3BYTE_BGR)
        val g = img.createGraphics()
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)

        val surfaceColour = surfaceColour(surface)
        drawSurface(g, width, height, surface, surfaceColour, rnd)
        g.dispose()

        // Object colour: distinct from the surface by the requested contrast.
        val objColour = objectColourFor(surfaceColour, contrastAgainstSurface)
        val placements = place(count, width, height, layout, objectSize, sizeJitter, rnd)

        var cropped = 0
        val g2 = img.createGraphics()
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        placements.forEachIndexed { i, p ->
            if (p.cropped) cropped++
            drawObject(g2, p, shape, objColour, i, rnd)
        }
        g2.dispose()

        applyLighting(img, lighting, rnd)
        if (blurSigma > 0) blur(img, blurSigma)
        addNoise(img, noise, rnd)

        return Scene(
            name = name,
            image = toMat(img),
            expectedCount = count,
            croppedCount = cropped,
            hasOverlap = layout == LayoutStyle.OVERLAP,
            hasTouching = layout == LayoutStyle.TOUCHING_ROWS || layout == LayoutStyle.TOUCHING_HEX,
            description = "count=$count surface=$surface lighting=$lighting layout=$layout shape=$shape size=$objectSize contrast=$contrastAgainstSurface"
        )
    }

    // ---------------------------------------------------------------- surfaces

    private fun surfaceColour(s: SurfaceStyle): Color = when (s) {
        SurfaceStyle.CONCRETE -> Color(158, 156, 150)
        SurfaceStyle.SAND -> Color(198, 176, 132)
        SurfaceStyle.WOOD -> Color(150, 108, 66)
        SurfaceStyle.TILE -> Color(226, 226, 222)
        SurfaceStyle.FABRIC -> Color(96, 104, 118)
        SurfaceStyle.WHITE_SHEET -> Color(240, 240, 240)
    }

    private fun drawSurface(
        g: Graphics2D, w: Int, h: Int,
        style: SurfaceStyle, base: Color, rnd: Random
    ) {
        g.color = base
        g.fillRect(0, 0, w, h)

        when (style) {
            SurfaceStyle.CONCRETE -> {
                // Blotchy mottling, like poured concrete.
                repeat(140) {
                    val cx = rnd.nextInt(w); val cy = rnd.nextInt(h)
                    val r = 20 + rnd.nextInt(70)
                    val d = (rnd.nextInt(30) - 15)
                    g.color = Color(
                        (base.red + d).coerceIn(0, 255),
                        (base.green + d).coerceIn(0, 255),
                        (base.blue + d).coerceIn(0, 255), 26
                    )
                    g.fillOval(cx - r, cy - r, r * 2, r * 2)
                }
                repeat(400) {
                    g.color = Color(90, 90, 88, 40)
                    g.fillOval(rnd.nextInt(w), rnd.nextInt(h), 1 + rnd.nextInt(3), 1 + rnd.nextInt(3))
                }
            }
            SurfaceStyle.SAND -> {
                repeat(260) {
                    val d = (rnd.nextInt(26) - 13)
                    g.color = Color(
                        (base.red + d).coerceIn(0, 255),
                        (base.green + d).coerceIn(0, 255),
                        (base.blue + d).coerceIn(0, 255), 30
                    )
                    g.fillOval(rnd.nextInt(w), rnd.nextInt(h), 4 + rnd.nextInt(20), 4 + rnd.nextInt(20))
                }
            }
            SurfaceStyle.WOOD -> {
                // Long directional grain.
                g.stroke = BasicStroke(1.6f)
                repeat(70) {
                    val y0 = rnd.nextInt(h)
                    g.color = Color(96, 66, 38, 60 + rnd.nextInt(50))
                    g.draw(Line2D.Double(0.0, y0.toDouble(), w.toDouble(), (y0 + (rnd.nextInt(9) - 4)).toDouble()))
                }
                repeat(200) {
                    g.color = Color(70, 46, 24, 45)
                    g.fillOval(rnd.nextInt(w), rnd.nextInt(h), 6 + rnd.nextInt(26), 2 + rnd.nextInt(4))
                }
            }
            SurfaceStyle.TILE -> {
                g.stroke = BasicStroke(2.0f)
                g.color = Color(180, 180, 176)
                val step = 110
                for (x in step until w step step) g.drawLine(x, 0, x, h)
                for (y in step until h step step) g.drawLine(0, y, w, y)
            }
            SurfaceStyle.FABRIC -> {
                g.stroke = BasicStroke(1.4f)
                repeat(300) {
                    g.color = Color(70, 76, 88, 40 + rnd.nextInt(40))
                    val x = rnd.nextInt(w); val y = rnd.nextInt(h)
                    g.draw(Line2D.Double(x.toDouble(), y.toDouble(), (x + rnd.nextInt(26) - 13).toDouble(), (y + rnd.nextInt(26) - 13).toDouble()))
                }
            }
            SurfaceStyle.WHITE_SHEET -> {
                repeat(60) {
                    val d = (rnd.nextInt(16) - 8)
                    g.color = Color(
                        (base.red + d).coerceIn(0, 255),
                        (base.green + d).coerceIn(0, 255),
                        (base.blue + d).coerceIn(0, 255), 30
                    )
                    g.fillOval(rnd.nextInt(w), rnd.nextInt(h), 40 + rnd.nextInt(120), 40 + rnd.nextInt(120))
                }
            }
        }
    }

    /** Picks an object colour that is [contrast] away from the surface. */
    private fun objectColourFor(surface: Color, contrast: Double): Color {
        val k = 1.0 + (contrast - 1.0)
        // Push the object colour away from the surface colour along the darkest
        // available axis so the two stay separable.
        val dark = Color(
            (surface.red * (1.0 - 0.45 * k)).toInt().coerceIn(0, 255),
            (surface.green * (1.0 - 0.45 * k)).toInt().coerceIn(0, 255),
            (surface.blue * (1.0 - 0.45 * k)).toInt().coerceIn(0, 255)
        )
        return dark
    }

    // ---------------------------------------------------------------- placement

    data class Placement(val cx: Double, val cy: Double, val w: Double, val h: Double, val angle: Double, val cropped: Boolean)

    private fun place(
        count: Int, w: Int, h: Int, layout: LayoutStyle,
        nominal: Int, jitter: Double, rnd: Random
    ): List<Placement> {
        val out = ArrayList<Placement>()
        fun size(): Pair<Double, Double> {
            val j = 1.0 + (rnd.nextDouble() - 0.5) * 2 * jitter
            return when (currentShape) {
                ObjectShape.PIPE -> (nominal * 1.7 * j to nominal * 0.55 * j)
                ObjectShape.PLANK -> (nominal * 2.2 * j to nominal * 0.45 * j)
                ObjectShape.CAN -> (nominal * 0.62 * j to nominal * 1.55 * j)
                else -> (nominal * 1.25 * j to nominal * j)
            }
        }

        when (layout) {
            LayoutStyle.GRID, LayoutStyle.TOUCHING_ROWS, LayoutStyle.TOUCHING_HEX -> {
                val (ow, _) = size()
                val (oh, _) = size()
                val gap = if (layout == LayoutStyle.GRID) nominal * 0.45 else 1.0
                val cols = max(1, ((w - 20) / (ow + gap)).toInt())
                val rows = max(1, ((h - 20) / (oh + gap)).toInt())
                val perRow = if (layout == LayoutStyle.TOUCHING_HEX) cols * 2 else cols
                var i = 0
                while (out.size < count) {
                    val r = out.size / perRow
                    val c = out.size % perRow
                    val (sw, sh) = size()
                    val x = 14.0 + c * (sw + gap) + sw / 2.0
                    val stagger = if (layout == LayoutStyle.TOUCHING_HEX && c % 2 == 1) (sh + gap) / 2.0 else 0.0
                    val y = 14.0 + r * (sh + gap) + stagger + sh / 2.0
                    if (y + sh / 2.0 > h) break
                    out.add(Placement(x, y, sw, sh, 0.0, false))
                    i++
                }
            }
            LayoutStyle.SCATTER -> {
                // Rejection sampling so objects never overlap.
                var attempts = 0
                val margin = nominal
                while (out.size < count && attempts < count * 400) {
                    attempts++
                    val (sw, sh) = size()
                    val x = margin + rnd.nextDouble() * (w - 2 * margin)
                    val y = margin + rnd.nextDouble() * (h - 2 * margin)
                    val clash = out.any { p ->
                        val dx = p.cx - x
                        val dy = p.cy - y
                        // Require a real gap, not just non-overlap.
                        hypot(dx, dy) < (p.w + sw) / 2.0 + nominal * 0.35
                    }
                    if (clash) continue
                    out.add(Placement(x, y, sw, sh, (rnd.nextDouble() - 0.5) * 0.16, false))
                }
            }
            LayoutStyle.OVERLAP -> {
                // Clustered with heavy overlap: the case the engine must refuse.
                val clusterX = w * (0.3 + rnd.nextDouble() * 0.4)
                val clusterY = h * (0.3 + rnd.nextDouble() * 0.4)
                repeat(count) {
                    val (sw, sh) = size()
                    val x = clusterX + (rnd.nextDouble() - 0.5) * nominal * 2.6
                    val y = clusterY + (rnd.nextDouble() - 0.5) * nominal * 2.6
                    out.add(Placement(x, y, sw, sh, (rnd.nextDouble() - 0.5) * 0.9, false))
                }
            }
            LayoutStyle.CROPPED -> {
                // Push objects off the frame edge so the count is genuinely hard.
                var i = 0
                while (out.size < count) {
                    val (sw, sh) = size()
                    val side = i % 4
                    var x: Double; var y: Double; var cropped = false
                    when (side) {
                        0 -> { x = -sw * 0.35; y = 40.0 + (i / 4) * (sh + 12); cropped = true }
                        1 -> { x = (w + sw * 0.35); y = 40.0 + (i / 4) * (sh + 12); cropped = true }
                        2 -> { x = 40.0 + (i / 4) * (sw + 12); y = -sh * 0.35; cropped = true }
                        else -> { x = 40.0 + (i / 4) * (sw + 12); y = (h + sh * 0.35); cropped = true }
                    }
                    if (x < -sw || x > w + sw || y < -sh || y > h + sh) { i++; continue }
                    out.add(Placement(x, y, sw, sh, 0.0, cropped))
                    i++
                }
            }
        }
        return out
    }

    /** Set by [build] so [place] can size objects according to the chosen shape. */
    private var currentShape: ObjectShape = ObjectShape.BRICK

    // ---------------------------------------------------------------- objects

    private fun drawObject(
        g: Graphics2D, p: Placement, shape: ObjectShape,
        base: Color, index: Int, rnd: Random
    ) {
        // Small per-object colour variation, as real goods always have.
        val v = (rnd.nextInt(34) - 17)
        val c = Color(
            (base.red + v).coerceIn(0, 255),
            (base.green + v).coerceIn(0, 255),
            (base.blue + v).coerceIn(0, 255)
        )
        g.color = c

        val x = p.cx - p.w / 2
        val y = p.cy - p.h / 2

        when (shape) {
            ObjectShape.BRICK -> {
                g.fill(Rectangle2D.Double(x, y, p.w, p.h))
                g.color = darker(c, 30)
                g.fill(Rectangle2D.Double(x, y + p.h * 0.72, p.w, p.h * 0.28))
                g.color = lighter(c, 26)
                g.fill(Rectangle2D.Double(x, y, p.w, max(2.0, p.h * 0.10)))
            }
            ObjectShape.ROUND_TILE -> {
                g.fill(Ellipse2D.Double(x, y, p.w, p.h))
                g.color = lighter(c, 22)
                g.fill(Ellipse2D.Double(x + p.w * 0.12, y + p.h * 0.12, p.w * 0.5, p.h * 0.4))
            }
            ObjectShape.CAN -> {
                g.fill(RoundRectangle2D.Double(x, y, p.w, p.h, p.w * 0.3, p.w * 0.3))
                g.color = lighter(c, 30)
                g.fill(Rectangle2D.Double(x + p.w * 0.18, y, p.w * 0.18, p.h))
            }
            ObjectShape.PIPE -> {
                g.fill(RoundRectangle2D.Double(x, y, p.w, p.h, p.h, p.h))
                g.color = lighter(c, 34)
                g.fill(Ellipse2D.Double(x, y, p.h, p.h))
                g.color = darker(c, 26)
                g.fill(Ellipse2D.Double(x + p.w - p.h, y, p.h, p.h))
            }
            ObjectShape.PLANK -> {
                g.fill(Rectangle2D.Double(x, y, p.w, p.h))
                g.color = darker(c, 34)
                for (k in 1..3) {
                    g.fill(Rectangle2D.Double(x + p.w * k / 4.0, y + p.h * 0.1, p.w * 0.02, p.h * 0.8))
                }
            }
            ObjectShape.POLYGON -> {
                val path = GeneralPath()
                val n = 7
                for (i in 0 until n) {
                    val a = 2.0 * Math.PI * i / n
                    val r = 0.5 * min(p.w, p.h) * (0.86 + rnd.nextDouble() * 0.24)
                    val px = p.cx + cos(a) * r
                    val py = p.cy + sin(a) * r
                    if (i == 0) path.moveTo(px, py) else path.lineTo(px, py)
                }
                path.closePath()
                g.fill(path)
            }
        }
    }

    private fun darker(c: Color, d: Int) = Color(
        (c.red - d).coerceIn(0, 255), (c.green - d).coerceIn(0, 255), (c.blue - d).coerceIn(0, 255)
    )

    private fun lighter(c: Color, d: Int) = Color(
        (c.red + d).coerceIn(0, 255), (c.green + d).coerceIn(0, 255), (c.blue + d).coerceIn(0, 255)
    )

    // ---------------------------------------------------------------- optics

    private fun applyLighting(img: BufferedImage, style: LightingStyle, rnd: Random) {
        val w = img.width; val h = img.height
        when (style) {
            LightingStyle.UNIFORM -> return
            LightingStyle.VIGNETTE -> {
                val cx = w / 2.0; val cy = h / 2.0
                val maxD = hypot(cx, cy)
                for (y in 0 until h) for (x in 0 until w) {
                    val f = (1.0 - 0.45 * (hypot(x - cx, y - cy) / maxD))
                    scalePixel(img, x, y, f)
                }
            }
            LightingStyle.SIDE_LIGHT -> {
                for (y in 0 until h) for (x in 0 until w) {
                    val f = 0.55 + 0.62 * (x.toDouble() / w)
                    scalePixel(img, x, y, f)
                }
            }
            LightingStyle.DIM -> {
                for (y in 0 until h) for (x in 0 until w) scalePixel(img, x, y, 0.42)
            }
            LightingStyle.HOT_SPOT -> {
                val cx = w * 0.5; val cy = h * 0.5
                for (y in 0 until h) for (x in 0 until w) {
                    val d = hypot(x - cx, y - cy) / (max(w, h) * 0.7)
                    scalePixel(img, x, y, (1.45 - 0.75 * d).coerceIn(0.25, 1.6))
                }
            }
        }
    }

    private fun scalePixel(img: BufferedImage, x: Int, y: Int, f: Double) {
        val rgb = img.getRGB(x, y)
        val r = (((rgb shr 16) and 0xFF) * f).toInt().coerceIn(0, 255)
        val gg = (((rgb shr 8) and 0xFF) * f).toInt().coerceIn(0, 255)
        val b = ((rgb and 0xFF) * f).toInt().coerceIn(0, 255)
        img.setRGB(x, y, Color(r, gg, b).rgb)
    }

    private fun blur(img: BufferedImage, sigma: Double) {
        if (sigma <= 0) return
        val w = img.width; val h = img.height
        val src = img.getRGB(0, 0, w, h, null, 0, w)
        val radius = max(1, (sigma * 2.5).toInt())
        val out = IntArray(src.size)
        val tmp = IntArray(src.size)
        for (y in 0 until h) for (x in 0 until w) {
            var sr = 0; var sg = 0; var sb = 0; var n = 0
            for (k in -radius..radius) {
                val xx = (x + k).coerceIn(0, w - 1)
                val c = src[y * w + xx]
                sr += (c shr 16) and 0xFF; sg += (c shr 8) and 0xFF; sb += c and 0xFF; n++
            }
            tmp[y * w + x] = Color(sr / n, sg / n, sb / n).rgb
        }
        for (y in 0 until h) for (x in 0 until w) {
            var sr = 0; var sg = 0; var sb = 0; var n = 0
            for (k in -radius..radius) {
                val yy = (y + k).coerceIn(0, h - 1)
                val c = tmp[yy * w + x]
                sr += (c shr 16) and 0xFF; sg += (c shr 8) and 0xFF; sb += c and 0xFF; n++
            }
            out[y * w + x] = Color(sr / n, sg / n, sb / n).rgb
        }
        img.setRGB(0, 0, w, h, out, 0, w)
    }

    private fun addNoise(img: BufferedImage, amount: Double, rnd: Random) {
        if (amount <= 0) return
        val w = img.width; val h = img.height
        val src = img.getRGB(0, 0, w, h, null, 0, w)
        for (i in src.indices) {
            val n = (rnd.nextDouble() - 0.5) * 2 * amount
            val r = ((((src[i] shr 16) and 0xFF)) + n).toInt().coerceIn(0, 255)
            val g = ((((src[i] shr 8) and 0xFF)) + n).toInt().coerceIn(0, 255)
            val b = ((((src[i]) and 0xFF)) + n).toInt().coerceIn(0, 255)
            src[i] = Color(r, g, b).rgb
        }
        img.setRGB(0, 0, w, h, src, 0, w)
    }

    // ---------------------------------------------------------------- conversion

    /**
     * BufferedImage -> OpenCV Mat, going through a real PNG encode/decode so the
     * engine sees the same kind of decoded image it gets from the camera.
     */
    fun toMat(img: BufferedImage): Mat {
        val out = ByteArrayOutputStream()
        ImageIO.write(img, "png", out)
        val buf = org.opencv.core.MatOfByte()
        buf.fromArray(*out.toByteArray())
        val mat = Imgcodecs.imdecode(buf, Imgcodecs.IMREAD_COLOR)
        buf.release()
        return mat
    }

    fun savePng(img: BufferedImage, path: String) {
        ImageIO.write(img, "png", java.io.File(path))
    }

    fun toBufferedImage(mat: Mat): BufferedImage {
        val buf = org.opencv.core.MatOfByte()
        Imgcodecs.imencode(".png", mat, buf)
        val bytes = ByteArray(buf.rows() * buf.cols())
        buf.get(0, 0, bytes)
        buf.release()
        return ImageIO.read(ByteArrayInputStreamCompat(bytes))
    }

    private fun ByteArrayInputStreamCompat(bytes: ByteArray) = java.io.ByteArrayInputStream(bytes)
}
