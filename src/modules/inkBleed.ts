/**
 * Ink Bleed Theme Transition Module
 * Self-contained, isolated. Pipeline: html2canvas snapshot -> flip data-theme
 * -> WebGL2 noise-shader bleed -> fade out.
 * Fallback: CSS cross-fade (reduced motion, missing WebGL2, or lost context).
 */

import gsap from 'gsap';

export type Theme = 'classic' | 'neon';

export interface InkBleedOptions {
  toggleSelector?: string;
  canvasClassName?: string;
  duration?: number;
  storageKey?: string;
}

// --- GLSL Shaders (verbatim, template strings, no bundler plugin) ---
const NOISE_CELLS = 32.0;

const FULLSCREEN_VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const INK_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uFromSize;
uniform vec2 uToSize;
uniform vec4 uFromMap;
uniform vec4 uToMap;
uniform float uCanvasScale;
uniform vec2 uRes;

uniform vec2 uCenter;
uniform float uRadius;
uniform float uCleanup;
uniform float uTime;
uniform float uRef;
uniform vec2 uSeed;
uniform mat2 uSeedRot;

uniform float uTendril;
uniform float uNoiseScale;
uniform float uSoftness;
uniform float uDrift;
uniform vec3 uRimColor;

out vec4 outColor;

const float A_LOBE = 0.22;
const float A_BLOB = 0.20;
const float A_SUM = A_LOBE + A_BLOB;
const float TENDRIL_REACH = 0.24;
const float FIBRE_PX = 1.8;
const float THIN_MAX_PX = 26.0;
const float SPECK_PX = 18.0;
const float HAZE_PX = 16.0;

uniform sampler2D uNoise;
const float INV_CELLS = 1.0 / ${NOISE_CELLS.toFixed(1)};

float gnoise(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).r * 2.0 - 1.0;
}
float gnoise2(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).g * 2.0 - 1.0;
}
const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8) * 2.03;

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.875;
}
float fbm4(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.9375;
}
float fbm5(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.96875;
}

vec3 sampleDoc(sampler2D tex, vec2 size, vec4 map, vec2 devPx) {
  vec2 texPx = devPx * map.x + map.yz;
  if (map.w > 0.5) texPx.y = size.y - texPx.y;
  vec2 uv = clamp(texPx, vec2(0.5), size - 0.5) / size;
  return texture(tex, uv).rgb;
}

void main() {
  vec2 devPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 css = devPx / uCanvasScale;
  vec2 rel = css - uCenter;
  float d = length(rel);
  float R = uRadius;
  float cleanup = uCleanup;

  float inner = R * (1.0 - A_SUM) + cleanup - FIBRE_PX - THIN_MAX_PX - uSoftness * 2.0;
  float outer = R * (1.0 + A_SUM) * (1.0 + TENDRIL_REACH * uTendril) + cleanup + FIBRE_PX + SPECK_PX + uSoftness * 2.0;
  if (d < inner) { outColor = vec4(sampleDoc(uTo, uToSize, uToMap, devPx), 1.0); return; }
  if (d > outer) { outColor = vec4(sampleDoc(uFrom, uFromSize, uFromMap, devPx), 1.0); return; }

  float t = uTime * uDrift;
  vec2 p = rel / uRef;
  vec2 dir = uSeedRot * (rel / max(d, 1e-3));
  float ns = uNoiseScale;

  vec2 q = p * (2.4 * ns) + uSeed;
  vec2 w = vec2(
    fbm3(q + vec2(0.0, 0.31 * t)),
    fbm3(q + vec2(5.2, 1.3) - vec2(0.27 * t, 0.0))
  );

  float blob = fbm5(q + 2.3 * w + vec2(0.12 * t, -0.08 * t));
  vec2 lq = dir * 0.9 + uSeed.yx * 0.37 + vec2(0.06 * t);
  float lobes = gnoise(lq) * 0.75 + gnoise(lq * 2.1 + 9.1) * 0.25;
  float reach = clamp(1.0 + A_LOBE * 1.6 * lobes + A_BLOB * 1.5 * blob, 1.0 - A_SUM, 1.0 + A_SUM);
  float f = d - R * reach;

  float gate = smoothstep(-0.35, 0.4, fbm3(dir * 1.6 + uSeed * 0.61 + 3.7));
  vec2 tq = dir * (2.2 * ns) + (d / uRef) * vec2(2.6, -1.9) * ns + 1.2 * w + uSeed * 1.7 + vec2(0.0, 0.18 * t);
  float n = fbm4(tq);
  float ridgePx = abs(n) * max(d, 24.0) / (4.0 * ns);
  float lenN = gnoise(dir * 3.1 + uSeed * 0.43 + vec2(0.1 * t)) * 0.5 + 0.5;
  float L = uTendril * TENDRIL_REACH * R * gate * (0.35 + 0.65 * lenN);
  float along = clamp(f / max(L, 1.0), 0.0, 1.0);
  float width = clamp(R * 0.022, 1.5, 9.0) * (1.0 - along * along) * gate;
  float ft = max(f - L, ridgePx - width);
  float k = 6.0;
  float hh = clamp(0.5 + 0.5 * (ft - f) / k, 0.0, 1.0);
  f = mix(ft, f, hh) - k * hh * (1.0 - hh);

  vec2 fq = css * 0.34 + uSeed * 13.0;
  float fibre = gnoise2(fq) * 0.65 + gnoise2(OCT * fq + 5.3) * 0.35;
  f += fibre * FIBRE_PX;

  f -= cleanup;

  float soft = max(uSoftness, 0.6);
  float inked = 1.0 - smoothstep(-soft, soft, f);

  float thinW = mix(3.0, THIN_MAX_PX, clamp(blob * 0.8 + 0.3, 0.0, 1.0));
  float density = mix(0.6, 1.0, smoothstep(0.0, thinW, -f));
  float cov = inked * density;

  float hazeW = mix(4.0, HAZE_PX, clamp(0.5 + 0.5 * blob, 0.0, 1.0));
  float haze = (1.0 - smoothstep(0.0, hazeW, f)) * smoothstep(-0.3, 0.6, 0.35 * fibre + w.x);
  cov = max(cov, haze * 0.24 * step(0.0, f));

  float ahead = clamp(f / SPECK_PX, 0.0, 1.0);
  if (f > 0.0 && ahead < 1.0) {
    float sn = gnoise2(css * 0.55 + uSeed * 7.0 + 41.0) * 0.5 + 0.5;
    float th = mix(0.80, 0.96, ahead);
    cov = max(cov, smoothstep(th, th + 0.04, sn) * 0.75 * (1.0 - ahead));
  }

  vec3 from = sampleDoc(uFrom, uFromSize, uFromMap, devPx);
  vec3 to = sampleDoc(uTo, uToSize, uToMap, devPx);
  vec3 col = mix(from, to, cov);

  float rimX = (f + soft * 1.1) / (soft * 1.4 + 1.2);
  float rim = exp(-rimX * rimX) * inked;
  col = mix(col, uRimColor, rim * 0.45);

  outColor = vec4(col, 1.0);
}
`;

// --- Noise Texture Generator ---
function generateNoiseTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const SIZE = 256;
  const CELLS = 32;

  function mulberry32(s: number) {
    let a = s >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function channel(rand: () => number): Float32Array {
    const gx = new Float32Array(CELLS * CELLS);
    const gy = new Float32Array(CELLS * CELLS);
    for (let i = 0; i < gx.length; i++) {
      const a = rand() * Math.PI * 2;
      gx[i] = Math.cos(a);
      gy[i] = Math.sin(a);
    }
    const texelsPerCell = SIZE / CELLS;
    const out = new Float32Array(SIZE * SIZE);
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const at = (cx: number, cy: number) =>
      ((cy + CELLS) % CELLS) * CELLS + ((cx + CELLS) % CELLS);

    for (let y = 0; y < SIZE; y++) {
      const py = (y + 0.5) / texelsPerCell;
      const cy = Math.floor(py);
      const fy = py - cy;
      const v = fade(fy);
      for (let x = 0; x < SIZE; x++) {
        const px = (x + 0.5) / texelsPerCell;
        const cx = Math.floor(px);
        const fx = px - cx;
        const u = fade(fx);
        const i00 = at(cx, cy);
        const i10 = at(cx + 1, cy);
        const i01 = at(cx, cy + 1);
        const i11 = at(cx + 1, cy + 1);
        const n00 = gx[i00]! * fx + gy[i00]! * fy;
        const n10 = gx[i10]! * (fx - 1) + gy[i10]! * fy;
        const n01 = gx[i01]! * fx + gy[i01]! * (fy - 1);
        const n11 = gx[i11]! * (fx - 1) + gy[i11]! * (fy - 1);
        const nx0 = n00 + (n10 - n00) * u;
        const nx1 = n01 + (n11 - n01) * u;
        out[y * SIZE + x] = nx0 + (nx1 - nx0) * v;
      }
    }
    for (let i = 0; i < out.length; i++) {
      out[i] = Math.max(-1, Math.min(1, out[i]! * 1.45));
    }
    return out;
  }

  const rand = mulberry32(0x1b1eed);
  const channels = [channel(rand), channel(rand), channel(rand), channel(rand)];
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i++) {
    for (let c = 0; c < 4; c++) {
      data[i * 4 + c] = Math.round((channels[c]![i]! * 0.5 + 0.5) * 255);
    }
  }

  const tex = gl.createTexture();
  if (!tex) throw new Error('[ink] Failed to create noise texture');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SIZE, SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return tex;
}

// --- Shader Compilation ---
function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const compile = (type: GLenum, src: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error('[ink] Failed to create shader');
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(`[ink] Shader compile error: ${log}`);
    }
    return s;
  };

  const p = gl.createProgram();
  if (!p) throw new Error('[ink] Failed to create program');
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`[ink] Program link error: ${gl.getProgramInfoLog(p)}`);
  }

  const uniformCache = new Map<string, WebGLUniformLocation | null>();
  return {
    program: p,
    uniform: (name: string) => {
      if (!uniformCache.has(name)) uniformCache.set(name, gl.getUniformLocation(p, name));
      return uniformCache.get(name) ?? null;
    },
  };
}

// --- Snapshot & Layout Utilities ---
interface Snapshot {
  theme: Theme;
  canvas: HTMLCanvasElement;
  scale: number;
  key: string;
}

function getDocumentSize() {
  const el = document.documentElement;
  return { width: el.clientWidth, height: Math.max(el.scrollHeight, el.clientHeight) };
}

function getLayoutKey(scale: number) {
  const { width, height } = getDocumentSize();
  return `${width}x${height}@${scale}`;
}

function getRenderScale() {
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  return Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2);
}

/**
 * Reads the actual --bg CSS custom property value for a given theme.
 * Temporarily applies data-theme to <html> so selectors like
 * :root[data-theme], html[data-theme], or [data-theme] all resolve
 * correctly, then restores the previous value.
 */
function getComputedThemeBackground(theme: Theme): string {
  const root = document.documentElement;
  const previousTheme = root.dataset.theme;

  try {
    root.dataset.theme = theme;
    const computedBg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (computedBg) {
      return computedBg;
    }
  } finally {
    if (previousTheme !== undefined) {
      root.dataset.theme = previousTheme;
    } else {
      delete root.dataset.theme;
    }
  }

  return theme === 'dark' ? '#000000' : '#f4f4f6';
}

async function captureDocument(theme: Theme, scale: number, maxTextureSize: number): Promise<Snapshot> {
  const { width, height } = getDocumentSize();
  const safeScale = Math.min(scale, maxTextureSize / width, maxTextureSize / height);
  const key = getLayoutKey(scale);

  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(document.body, {
    scale: safeScale,
    backgroundColor: getComputedThemeBackground(theme),
    x: 0,
    y: 0,
    width,
    height,
    scrollX: 0,
    scrollY: 0,
    windowWidth: width,
    windowHeight: document.documentElement.clientHeight,
    logging: false,
    useCORS: true,
    ignoreElements: (el) => {
      return el.classList.contains('ink-canvas') || el.hasAttribute('data-ink-ignore');
    },
    onclone: (clonedDoc) => {
      clonedDoc.documentElement.dataset.theme = theme;
      clonedDoc.querySelectorAll<HTMLElement>('[data-ink-live], #theme-toggle').forEach((el) => {
        el.style.visibility = 'hidden';
      });
    },
  });

  return { theme, canvas, scale: safeScale, key };
}

// --- Main Engine ---
export function initInkBleed(options: InkBleedOptions = {}) {
  const {
    toggleSelector = '#theme-toggle',
    canvasClassName = 'ink-canvas',
    duration = 1.35,
    storageKey = 'orbix_theme',
  } = options;

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Initial theme resolution & persistence
  const savedTheme = localStorage.getItem(storageKey) as Theme | null;
  const initialTheme: Theme = savedTheme === 'neon' ? 'neon' : 'classic';

  root.dataset.theme = initialTheme;

  const toggleBtn = document.querySelector<HTMLButtonElement>(toggleSelector);
  if (!toggleBtn) {
    console.warn(
      `[ink] Toggle button element matching selector "${toggleSelector}" was not found in the DOM. ` +
      `Ensure the element exists in HTML or is mounted before calling initInkBleed().`
    );
  } else {
    toggleBtn.setAttribute('aria-pressed', String(initialTheme === 'dark'));
    toggleBtn.setAttribute('data-ink-live', '');
  }

  // 2. Overlay canvas
  const canvas = document.createElement('canvas');
  canvas.className = canvasClassName;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-ink-ignore', '');
  document.body.appendChild(canvas);

  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '99999';
  canvas.style.pointerEvents = 'none';
  canvas.style.display = 'none';
  canvas.style.opacity = '0';

  // 3. WebGL2 init
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  let isWebGLAvailable = gl !== null;
  let isContextLost = false;

  let programInfo: ReturnType<typeof createProgram> | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let noiseTex: WebGLTexture | null = null;
  const textureMap = new Map<Theme, { texture: WebGLTexture; width: number; height: number; scale: number; key: string }>();

  if (gl) {
    try {
      programInfo = createProgram(gl, FULLSCREEN_VERT, INK_FRAG);
      vao = gl.createVertexArray();
      noiseTex = generateNoiseTexture(gl);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    } catch (e) {
      console.warn('[ink] WebGL2 initialization failed; using cross-fade fallback.', e);
      isWebGLAvailable = false;
    }

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      isContextLost = true;
      textureMap.clear();
    });

    canvas.addEventListener('webglcontextrestored', () => {
      isContextLost = false;
      try {
        if (gl) {
          programInfo = createProgram(gl, FULLSCREEN_VERT, INK_FRAG);
          vao = gl.createVertexArray();
          noiseTex = generateNoiseTexture(gl);
          schedulePrecapture(0);
        }
      } catch {
        isWebGLAvailable = false;
      }
    });
  }

  // 4. Precapture
  let isCapturing = false;
  let captureQueued = false;
  let resizeTimer = 0;

  function schedulePrecapture(delayMs = 250) {
    if (!isWebGLAvailable || isContextLost || reducedMotionQuery.matches) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => void runPrecapture(), delayMs);
  }

  async function runPrecapture() {
    if (!gl || isCapturing || isAnimating) {
      captureQueued = true;
      return;
    }
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const scale = getRenderScale();
    const currentKey = getLayoutKey(scale);
    const currentTheme = (root.dataset.theme as Theme) || 'light';
    const targetTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

    const needed = [currentTheme, targetTheme].filter((t) => textureMap.get(t)?.key !== currentKey);
    if (needed.length === 0) return;

    isCapturing = true;
    captureQueued = false;
    try {
      for (const t of needed) {
        const snap = await captureDocument(t, scale, maxTex);
        if (getLayoutKey(scale) !== snap.key) {
          captureQueued = true;
          break;
        }
        let texEntry = textureMap.get(t);
        if (!texEntry) {
          const tex = gl.createTexture();
          if (!tex) continue;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          texEntry = { texture: tex, width: 0, height: 0, scale: 0, key: '' };
          textureMap.set(t, texEntry);
        }
        gl.bindTexture(gl.TEXTURE_2D, texEntry.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, snap.canvas);
        texEntry.width = snap.canvas.width;
        texEntry.height = snap.canvas.height;
        texEntry.scale = snap.scale;
        texEntry.key = snap.key;
      }
    } catch {
      isWebGLAvailable = false;
    } finally {
      isCapturing = false;
      if (captureQueued) schedulePrecapture(250);
    }
  }

  if (document.fonts) {
    document.fonts.ready.then(() => schedulePrecapture(100));
  } else {
    window.addEventListener('load', () => schedulePrecapture(100));
  }
  window.addEventListener('resize', () => schedulePrecapture(300));

  // 5. Transition engine
  let isAnimating = false;
  let activeTween: gsap.core.Tween | null = null;
  const spreadShape = { growth: 0.7, cleanupFrom: 0.45, cleanupReach: 0.4, cleanupPow: 2.0 };

  function fallbackCrossFade(nextTheme: Theme) {
    root.classList.add('ink-crossfade');
    root.dataset.theme = nextTheme;
    localStorage.setItem(storageKey, nextTheme);
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(nextTheme === 'dark'));

    window.setTimeout(() => {
      root.classList.remove('ink-crossfade');
      isAnimating = false;
      schedulePrecapture(150);
    }, 450);
  }

  function toggle(originPoint?: { x: number; y: number }) {
    if (isAnimating) return;

    const currentTheme = (root.dataset.theme as Theme) || 'light';
    const nextTheme: Theme = currentTheme === 'classic' ? 'neon' : 'classic';
    const scale = getRenderScale();
    const currentKey = getLayoutKey(scale);

    const canUseWebGL =
      isWebGLAvailable &&
      !isContextLost &&
      !reducedMotionQuery.matches &&
      gl &&
      programInfo &&
      vao &&
      noiseTex &&
      textureMap.get(currentTheme)?.key === currentKey &&
      textureMap.get(nextTheme)?.key === currentKey;

    isAnimating = true;

    if (!canUseWebGL) {
      fallbackCrossFade(nextTheme);
      return;
    }

    let center = originPoint;
    if (!center && toggleBtn) {
      const rect = toggleBtn.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    if (!center) {
      center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const maxDist =
      Math.max(
        Math.hypot(center.x, center.y),
        Math.hypot(vw - center.x, center.y),
        Math.hypot(center.x, vh - center.y),
        Math.hypot(vw - center.x, vh - center.y)
      ) + 6;

    const seed = {
      x: Math.random() * 64 - 32,
      y: Math.random() * 64 - 32,
      angle: Math.random() * Math.PI * 2,
    };

    const dpr = getRenderScale();
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    const canvasScale = canvas.width / vw;

    const fromTex = textureMap.get(currentTheme)!;
    const toTex = textureMap.get(nextTheme)!;

    const rimColor: [number, number, number] = nextTheme === 'classic' ? [1.0, 0.996, 0.985] : [0.0, 0.0, 0.015];

    canvas.style.display = 'block';
    canvas.style.opacity = '1';

    const renderFrame = (progress: number, timeS: number) => {
      if (!gl || !programInfo || !vao || !noiseTex) return;

      const linear = Math.min(1, timeS / duration);
      const ramp = Math.max(0, (linear - spreadShape.cleanupFrom) / (1 - spreadShape.cleanupFrom));
      const cleanup =
        Math.pow(ramp, spreadShape.cleanupPow) * maxDist * spreadShape.cleanupReach +
        Math.max(0, (linear - 0.97) / 0.03) * maxDist;
      const radius = progress * maxDist * spreadShape.growth;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(programInfo.program);
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTex.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTex.texture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, noiseTex);

      gl.uniform1i(programInfo.uniform('uFrom'), 0);
      gl.uniform1i(programInfo.uniform('uTo'), 1);
      gl.uniform1i(programInfo.uniform('uNoise'), 2);

      gl.uniform2f(programInfo.uniform('uFromSize'), fromTex.width, fromTex.height);
      gl.uniform2f(programInfo.uniform('uToSize'), toTex.width, toTex.height);

      gl.uniform4f(
        programInfo.uniform('uFromMap'),
        fromTex.scale / canvasScale,
        Math.floor(window.scrollX * fromTex.scale + 0.5),
        Math.floor(window.scrollY * fromTex.scale + 0.5),
        0
      );
      gl.uniform4f(
        programInfo.uniform('uToMap'),
        toTex.scale / canvasScale,
        Math.floor(window.scrollX * toTex.scale + 0.5),
        Math.floor(window.scrollY * toTex.scale + 0.5),
        0
      );

      gl.uniform1f(programInfo.uniform('uCanvasScale'), canvasScale);
      gl.uniform2f(programInfo.uniform('uRes'), canvas.width, canvas.height);
      gl.uniform2f(programInfo.uniform('uCenter'), center!.x, center!.y);
      gl.uniform1f(programInfo.uniform('uRadius'), radius);
      gl.uniform1f(programInfo.uniform('uCleanup'), cleanup);
      gl.uniform1f(programInfo.uniform('uTime'), timeS);
      gl.uniform1f(programInfo.uniform('uRef'), Math.max(vw, vh));
      gl.uniform2f(programInfo.uniform('uSeed'), seed.x, seed.y);

      const cos = Math.cos(seed.angle);
      const sin = Math.sin(seed.angle);
      gl.uniformMatrix2fv(programInfo.uniform('uSeedRot'), false, [cos, sin, -sin, cos]);

      gl.uniform1f(programInfo.uniform('uTendril'), 1.0);
      gl.uniform1f(programInfo.uniform('uNoiseScale'), 1.0);
      gl.uniform1f(programInfo.uniform('uSoftness'), 1.4);
      gl.uniform1f(programInfo.uniform('uDrift'), 1.0);
      gl.uniform3fv(programInfo.uniform('uRimColor'), rimColor);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    renderFrame(0, 0);

    root.dataset.theme = nextTheme;
    localStorage.setItem(storageKey, nextTheme);
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(nextTheme === 'dark'));

    const animState = { progress: 0 };
    activeTween = gsap.to(animState, {
      progress: 1,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        const timeS = activeTween?.time() ?? 0;
        renderFrame(animState.progress, timeS);
      },
      onComplete: () => {
        gsap.to(canvas, {
          opacity: 0,
          duration: 0.15,
          ease: 'power1.out',
          onComplete: () => {
            canvas.style.display = 'none';
            isAnimating = false;
            activeTween = null;
            schedulePrecapture(150);
          },
        });
      },
    });
  }

  const handleToggleClick = (e: MouseEvent) => {
    if (e.detail === 0) toggle();
    else toggle({ x: e.clientX, y: e.clientY });
  };

  toggleBtn?.addEventListener('click', handleToggleClick);

  return {
    destroy: () => {
      toggleBtn?.removeEventListener('click', handleToggleClick);
      activeTween?.kill();
      window.clearTimeout(resizeTimer);
      canvas.remove();
    },
    toggle,
  };
}
