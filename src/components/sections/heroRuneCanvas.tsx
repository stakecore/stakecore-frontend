import { useEffect, useRef } from 'react'
import profile from '../../assets/images/about/profile.svg'


// GPU implementation of the ASCII-wave hero background. A single
// full-screen fragment shader picks an ASCII glyph per pixel from a
// pre-rasterized glyph atlas based on (distance, phase) and tints it
// white inside the Stakecore rune silhouette / gray outside.
//
// Per-frame main-thread work reduces to: update one `u_phase` uniform
// + drawArrays(6). All shading happens on the GPU in parallel.
const RAMP = ' .,:;+*x#@'
const SVG_ASPECT = 340 / 380

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

// Fragment shader. The wave is purely f(dist, phase); the rune mask
// is a tiny texture that decides per-cell whether to tint white or
// gray; the glyph atlas is a 10-wide horizontal strip of pre-rendered
// RAMP characters in white, multiplied by the per-cell color.
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_phase;
uniform vec2  u_resolution;     // canvas size in backing-store pixels
uniform float u_cellSizePx;     // backing-store pixels per cell
uniform vec2  u_runeSizeCells;  // (runeW, runeH) in cells
uniform sampler2D u_glyphAtlas; // horizontal strip, RAMP_LEN glyphs
uniform sampler2D u_runeMask;   // rune silhouette texture

out vec4 fragColor;

const float RAMP_LEN = 10.0;
const float INSIDE_COLOR = 1.0;       // white
const float OUTSIDE_COLOR = 0.42;     // ~#6B6B6B
const float INSIDE_THRESHOLD = 0.05;

void main() {
  // gl_FragCoord is bottom-left origin in WebGL — flip Y so the rest
  // of the math reads in canvas-2D / top-left coordinates.
  vec2 px = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  vec2 cell = floor(px / u_cellSizePx);
  vec2 cellCount = ceil(u_resolution / u_cellSizePx);
  vec2 cellCenter = cellCount * 0.5;

  // Wave value at this cell's radial distance.
  float dist = length(cell - cellCenter);
  float wave = 0.5
             + 0.35 * sin(dist * 0.42 - u_phase)
             + 0.15 * sin(dist * 0.18 - u_phase * 0.6);

  // Pick the RAMP glyph index from wave intensity. clamp to [0, 1)
  // so floor never hits RAMP_LEN.
  float charIdx = floor(clamp(wave, 0.0, 0.9999) * RAMP_LEN);

  // Is this cell inside the rune silhouette? Sample the centered mask
  // texture; cells outside the rune-sized rectangle short-circuit to 0.
  vec2 cellInRune = (cell - cellCenter + u_runeSizeCells * 0.5) / u_runeSizeCells;
  float inside = 0.0;
  if (all(greaterThanEqual(cellInRune, vec2(0.0))) && all(lessThanEqual(cellInRune, vec2(1.0)))) {
    vec4 maskTex = texture(u_runeMask, cellInRune);
    inside = maskTex.r * maskTex.a;
  }
  bool isInside = inside > INSIDE_THRESHOLD;

  // Local position within the cell (0..1), then map into atlas UV.
  vec2 cellLocal = (px - cell * u_cellSizePx) / u_cellSizePx;
  vec2 atlasUV = vec2((charIdx + cellLocal.x) / RAMP_LEN, cellLocal.y);

  float glyphAlpha = texture(u_glyphAtlas, atlasUV).a;
  float color = isInside ? INSIDE_COLOR : OUTSIDE_COLOR;

  // Canvas is opaque (alpha:false context); CSS opacity + gradient
  // mask handle compositing into the page.
  fragColor = vec4(vec3(color * glyphAlpha), 1.0);
}`

const HeroRuneCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false })
    if (!gl) {
      console.warn('hero-rune: WebGL2 unavailable; background will not render')
      return
    }

    const dpr = window.devicePixelRatio || 1
    // Smaller cells on phones: more rune-silhouette samples (logo detail
    // becomes visible) and denser wave bands so the field doesn't read
    // as a few wide stretched stripes against a tall narrow viewport.
    const cellSize = window.innerWidth < 768 ? 6 : 10  // CSS pixels per cell
    const cellSizePx = cellSize * dpr // backing-store pixels per cell

    // --- shader compile + link ---
    const compile = (type: number, src: string): WebGLShader | null => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('hero-rune shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('hero-rune program link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    // --- full-screen quad geometry (VAO + VBO) ---
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    // --- uniform locations ---
    gl.useProgram(program)
    const uPhase = gl.getUniformLocation(program, 'u_phase')
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uCellSize = gl.getUniformLocation(program, 'u_cellSizePx')
    const uRuneSize = gl.getUniformLocation(program, 'u_runeSizeCells')
    gl.uniform1i(gl.getUniformLocation(program, 'u_glyphAtlas'), 0)
    gl.uniform1i(gl.getUniformLocation(program, 'u_runeMask'), 1)
    if (uCellSize) gl.uniform1f(uCellSize, cellSizePx)

    // --- glyph atlas: a 1-row horizontal strip of all RAMP chars
    // rendered in white. The fragment shader multiplies by per-cell
    // color, so we only need one color baked into the atlas.
    const buildGlyphAtlas = (): HTMLCanvasElement => {
      const charW = Math.ceil(cellSizePx)
      const charH = Math.ceil(cellSizePx)
      const off = document.createElement('canvas')
      off.width = charW * RAMP.length
      off.height = charH
      const octx = off.getContext('2d')
      if (octx) {
        octx.font = `${cellSizePx}px 'Roboto Mono', ui-monospace, monospace`
        octx.fillStyle = '#FFFFFF'
        octx.textBaseline = 'top'
        for (let i = 0; i < RAMP.length; i++) {
          octx.fillText(RAMP[i], i * charW, 0)
        }
      }
      return off
    }
    const glyphTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, glyphTex)
    // Note: don't enable UNPACK_FLIP_Y_WEBGL — the fragment shader is
    // already working in top-origin coordinates (it flips gl_FragCoord.y),
    // so enabling the upload-time flip on top would invert the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildGlyphAtlas())
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // --- rune mask texture (filled by rasterize() once per resize) ---
    const runeTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, runeTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // --- geometry state ---
    let w = 0, h = 0, cols = 0, rows = 0
    let runeW = 0, runeH = 0

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.ceil(w * dpr)
      canvas.height = Math.ceil(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      cols = Math.ceil(w / cellSize)
      rows = Math.ceil(h / cellSize)
      // Rune sprite size: 55% of the shorter grid axis, preserve aspect.
      const minor = Math.min(cols, rows)
      runeH = Math.max(20, Math.round(minor * 0.55))
      runeW = Math.round(runeH * SVG_ASPECT)
      if (runeW > cols) {
        runeW = cols
        runeH = Math.round(runeW / SVG_ASPECT)
      }
      gl.useProgram(program)
      if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height)
      if (uRuneSize) gl.uniform2f(uRuneSize, runeW, runeH)
    }

    // Rasterize profile.svg into a runeW × runeH texture. Sampled by
    // the fragment shader to decide inside/outside per cell. Async
    // because <img> loading is async, but only runs at setup + resize.
    const rasterize = () => new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const off = document.createElement('canvas')
        off.width = runeW
        off.height = runeH
        const octx = off.getContext('2d')
        if (octx) octx.drawImage(img, 0, 0, runeW, runeH)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, runeTex)
        // Note: don't enable UNPACK_FLIP_Y_WEBGL — the fragment shader is
    // already working in top-origin coordinates (it flips gl_FragCoord.y),
    // so enabling the upload-time flip on top would invert the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off)
        resolve()
      }
      img.src = profile
    })

    let phase = 0
    let last = 0
    let raf = 0
    let ready = false
    // RAF only runs when the canvas is in-viewport AND the tab is in
    // the foreground. Start optimistic so we don't delay the first
    // paint while waiting for the IntersectionObserver to fire.
    let intersecting = true
    let pageVisible = !document.hidden
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const drawFrame = () => {
      gl.useProgram(program)
      if (uPhase) gl.uniform1f(uPhase, phase)
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (!ready) return
      if (t - last < 80) return
      const dt = last === 0 ? 16 : t - last
      last = t
      phase += dt * 0.002
      drawFrame()
    }

    const startLoop = () => {
      if (raf !== 0) return
      if (reduceMotion || !intersecting || !pageVisible) return
      // Reset the time-since-last so the first frame after a resume
      // doesn't see a huge dt and jump the wave forward.
      last = 0
      raf = requestAnimationFrame(tick)
    }

    const stopLoop = () => {
      if (raf === 0) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    setup()
    rasterize().then(() => {
      ready = true
      if (reduceMotion) drawFrame()
      else startLoop()
    })

    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting
      if (intersecting) startLoop()
      else stopLoop()
    })
    io.observe(canvas)

    const onVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible) startLoop()
      else stopLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ResizeObserver on the canvas (not window 'resize') so we react to
    // iOS Safari URL-bar collapse, orientation changes, and any other
    // size shift of the 100vh container — keeps the backing store in
    // step with the CSS box so the GPU output isn't stretched.
    const onResize = () => {
      setup()
      rasterize().then(() => {
        if (reduceMotion) drawFrame()
      })
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      stopLoop()
      ro.disconnect()
      gl.deleteTexture(glyphTex)
      gl.deleteTexture(runeTex)
      gl.deleteBuffer(vbo)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="hero-rune-canvas"
      aria-hidden
    />
  )
}

export default HeroRuneCanvas
