// @ts-nocheck
// Orbit Hero's live, rotating Earth, rendered with WebGL2.
// Same camera, lighting and atmosphere as the still earth.webp, so the first frame matches
// the picture exactly and the hand-off between them is invisible.

const VIEW = { lat: -7.86, lon: 70.01, roll: 0.34, D: 5.79 };
const SECONDS_PER_REVOLUTION = 100;
const CLOUD_DRIFT_DEG_PER_S = 0.25; // clouds slip slightly faster than the ground
const RAMP_SECONDS = 2.5; // ease into full speed after the hand-off
const MAX_PIXELS = 5_000_000;

// Canvas covers the globe's bounding box (plus a thin halo margin) in unit-disk space:
// u ∈ [-1.02, 1.02], v ∈ [V_BOTTOM, 1.02]. V_BOTTOM is where the image frame ends.
export const DISK = { margin: 1.02, vBottom: 0.1354 };

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); // origin top-left
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSurf;
uniform sampler2D uCloud;
uniform vec3 uE, uN, uC;     // camera basis in Earth-fixed coordinates
uniform float uCloudShift;   // extra cloud rotation, in texture-u units
uniform vec2 uLatBottom;     // bottom latitude (deg) of surface / cloud textures
uniform float uRadPx;        // globe radius in device pixels (edge anti-aliasing)

const float D = ${VIEW.D.toFixed(4)};
const float M = ${DISK.margin.toFixed(4)};
const float VB = ${DISK.vBottom.toFixed(4)};
const float GLOW = 1.006;
const float PI = 3.14159265359;

vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }

// Seam-free sampling of an equirectangular map (Tarini): pick derivatives from
// whichever u-parameterisation is continuous at this pixel.
vec4 sampleEq(sampler2D tex, float u, float v) {
  float u1 = fract(u);
  float u2 = fract(u + 0.5) - 0.5;
  vec2 d1 = vec2(dFdx(u1), dFdy(u1));
  vec2 d2 = vec2(dFdx(u2), dFdy(u2));
  vec2 du = (abs(d1.x) + abs(d1.y) <= abs(d2.x) + abs(d2.y)) ? d1 : d2;
  return textureGrad(tex, vec2(u1, v), vec2(du.x, dFdx(v)), vec2(du.y, dFdy(v)));
}

void main() {
  float u = -M + 2.0 * M * vUv.x;
  float v = M - (M - VB) * vUv.y;
  float d = length(vec2(u, v));
  vec3 sun = normalize(vec3(0.86, 0.3, 0.42));

  // ray from the camera, silhouette mapped onto the unit disk
  float tanA = 1.0 / sqrt(D * D - 1.0);
  vec3 ray = normalize(vec3(u * tanA, v * tanA, -1.0));
  float bq = D * ray.z;
  float t = -bq - sqrt(max(0.0, bq * bq - (D * D - 1.0)));
  vec3 p = vec3(0.0, 0.0, D) + ray * t; // surface point == normal
  float cosV = max(0.0, -dot(ray, p));

  vec3 P = p.x * uE + p.y * uN + p.z * uC;
  float lat = degrees(asin(clamp(P.z, -1.0, 1.0)));
  float lonU = atan(P.y, P.x) / (2.0 * PI) + 0.5;

  vec3 col = toLin(sampleEq(uSurf, lonU, (90.0 - lat) / (90.0 - uLatBottom.x)).rgb);
  col *= vec3(0.92, 0.95, 1.0);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = lum + (col - lum) * vec3(1.05, 1.08, 0.95);

  float cl = sampleEq(uCloud, lonU + uCloudShift, (90.0 - lat) / (90.0 - uLatBottom.y)).r;
  float ca = smoothstep(0.1, 0.85, cl) * 0.96;
  float cw = 0.86 * pow(cl, 0.6);
  col = mix(col, vec3(cw, cw, cw * 1.02), ca);

  float ndl = max(0.0, dot(p, sun));
  col *= 0.01 + 1.6 * pow(ndl, 2.7);

  float fres = pow(1.0 - cosV, 2.4);
  float haze = fres * (0.03 + 0.97 * ndl) * 0.42;
  col = col * (1.0 - haze) + vec3(0.06, 0.2, 0.75) * haze;
  float rim = pow(1.0 - cosV, 14.0) * ndl * 0.6;
  col += vec3(0.03, 0.16, 0.62) * rim;

  vec3 srgb = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  float a = clamp((1.0 - d) * uRadPx + 0.5, 0.0, 1.0);

  // thin atmosphere just outside the limb, on the lit side
  float g = 1.0 - (d - 1.0) / (GLOW - 1.0);
  float lit = max(0.0, dot(vec2(u, v) / max(d, 1e-5), sun.xy) * 1.1 + 0.05);
  float ga = (d >= 1.0 && d <= GLOW) ? pow(g, 2.2) * 0.22 * min(1.0, lit) : 0.0;

  vec4 globe = vec4(srgb * a, a);                      // premultiplied
  vec4 halo = vec4(vec3(40.0, 110.0, 255.0) / 255.0 * ga, ga);
  outColor = d < 1.0 ? globe : halo;
}`;

function basis(lat0: number, lon0: number, roll: number) {
  const r = Math.PI / 180, p = lat0 * r, l = lon0 * r, q = roll * r;
  const c = [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  const e = [-Math.sin(l), Math.cos(l), 0];
  const n = [-Math.sin(p) * Math.cos(l), -Math.sin(p) * Math.sin(l), Math.cos(p)];
  return {
    c,
    e: e.map((v, i) => v * Math.cos(q) + n[i] * Math.sin(q)),
    n: n.map((v, i) => -e[i] * Math.sin(q) + v * Math.cos(q)),
  };
}

// load event rather than img.decode(): decode() stalls in background tabs
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Fits an image within the GPU's texture limit (only needed on old/low-end GPUs). */
function fitToLimit(img: HTMLImageElement, max: number): TexImageSource {
  if (img.naturalWidth <= max) return img;
  const s = max / img.naturalWidth;
  const c = document.createElement("canvas");
  c.width = max;
  c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export type GlobeHandle = { destroy: () => void };

export async function startGlobe(
  canvas: HTMLCanvasElement,
  textures: { surface: string; clouds: string; surfaceBottomLat: number; cloudsBottomLat: number },
  onReady: () => void,
  onFail: () => void,
  signal: AbortSignal,
): Promise<GlobeHandle> {
  const noop = { destroy() {} };
  // load first: nothing touches the GL context until we know this run is still wanted
  let surfImg: HTMLImageElement, cloudImg: HTMLImageElement;
  try {
    [surfImg, cloudImg] = await Promise.all([loadImage(textures.surface), loadImage(textures.clouds)]);
  } catch {
    if (!signal.aborted) onFail();
    return noop;
  }
  if (signal.aborted) return noop;

  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl || gl.isContextLost()) {
    onFail();
    return noop;
  }

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  } catch (err) {
    console.warn("Globe shader failed, keeping static Earth", err);
    onFail();
    return noop;
  }

  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const makeTexture = (unit: number, src: TexImageSource, single: boolean) => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    if (single) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) {
      const maxA = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, maxA));
    }
    return tex;
  };
  const texSurf = makeTexture(0, fitToLimit(surfImg, maxTex), false);
  const texCloud = makeTexture(1, fitToLimit(cloudImg, maxTex), true);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(prog);
  const U = (name: string) => gl.getUniformLocation(prog, name);
  gl.uniform1i(U("uSurf"), 0);
  gl.uniform1i(U("uCloud"), 1);
  gl.uniform2f(U("uLatBottom"), textures.surfaceBottomLat, textures.cloudsBottomLat);
  const uE = U("uE"), uN = U("uN"), uC = U("uC"), uShift = U("uCloudShift"), uRad = U("uRadPx");

  // size the drawing buffer to the canvas' CSS box (transforms don't count), capped for fill-rate
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (w * h));
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
  };
  const ro = new ResizeObserver(() => {
    resize();
    draw();
  });
  ro.observe(canvas);
  resize();

  let lon = VIEW.lon; // degrees; decreasing = surface turns west → east, like the real Earth
  let cloud = 0;
  const draw = () => {
    if (gl.isContextLost()) return;
    const b = basis(VIEW.lat, lon, VIEW.roll);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texSurf);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texCloud);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3fv(uE, b.e);
    gl.uniform3fv(uN, b.n);
    gl.uniform3fv(uC, b.c);
    gl.uniform1f(uShift, cloud / 360);
    gl.uniform1f(uRad, canvas.width / (2 * DISK.margin));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  draw();
  onReady();

  // spin — only while on screen and the tab is visible (rAF pauses in background tabs)
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  const speed = 360 / SECONDS_PER_REVOLUTION;
  let raf = 0, last = 0, spun = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!visible || reduce.matches) return;
    spun += dt;
    const ease = Math.min(1, spun / RAMP_SECONDS);
    const k = ease * ease * (3 - 2 * ease);
    lon = (lon - speed * k * dt + 360) % 360;
    cloud = (cloud + CLOUD_DRIFT_DEG_PER_S * k * dt) % 360;
    draw();
  };
  // give the cross-fade a moment before the ground starts turning
  const startTimer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 700);

  const onLost = (e: Event) => {
    e.preventDefault();
    onFail();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    destroy() {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteTexture(texSurf);
      gl.deleteTexture(texCloud);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}
