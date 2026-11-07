"use client";
/**
 * A living picture (docs/DESIGN.md §13): a credited painting that moves. The real image
 * is always in the page; a small WebGL shader draws over it and grades it in the room's
 * colours, lets the surface breathe, and sends shafts of coloured light and drifting
 * embers across it.
 *
 * Raw WebGL rather than three.js, so these pages do not download three.js: one quad,
 * one texture, about 30 frames a second, at most 1280 pixels wide. It stops off-screen
 * and when the tab is hidden. The texture is read from the <img> next/image already
 * loaded, so nothing is downloaded twice.
 *
 * Still (reduced motion or paused): one graded frame, so the colour stays and nothing moves.
 * No WebGL, a failed shader or a lost context: the canvas goes and the painting remains.
 */
import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import { hexToRgb } from "@/lib/cinema";
import { useCinemaStill } from "./motion-pref";

export type Picture = { src: StaticImageData; alt: string; focus: string };

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `precision highp float;
uniform sampler2D uImg; uniform vec2 uRes, uImgSize, uFocus; uniform float uTime, uScroll; uniform vec3 uShadow, uLight;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= .5; } return s; }
vec3 screen(vec3 a, vec3 b){ return 1. - (1. - a) * (1. - b); }

/* object-fit: cover, with a slow camera push and the picture's chosen focus. */
vec2 cover(vec2 uv, float zoom){
  float ra = uRes.x / uRes.y, ia = uImgSize.x / uImgSize.y;
  vec2 s = (ra > ia ? vec2(1., ia / ra) : vec2(ra / ia, 1.)) / zoom;
  return uv * s + (1. - s) * uFocus;
}

void main(){
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  float zoom = 1.1 + sin(t * .07) * .04 + uScroll * .12;
  vec2 uv = cover(vUv, zoom);

  /* The surface breathes: slow flow, as of heat over the paint. */
  vec2 q = uv * vec2(aspect, 1.) * 3.;
  vec2 flow = vec2(fbm(q + vec2(t * .07, 0.)), fbm(q + vec2(5.2, 1.3 - t * .06))) - .47;
  uv += flow * .016;

  vec3 c = texture2D(uImg, uv).rgb;
  float l = dot(c, vec3(.299, .587, .114));

  /* Grade: lift the saturation, push the contrast, then split-tone into the room's two colours. */
  c = clamp(mix(vec3(l), c, 1.7), 0., 1.);
  c = clamp((c - .5) * 1.16 + .54, 0., 1.);
  c = mix(c, c * .55 + uShadow * .62, pow(1. - l, 1.7) * .9);
  c = screen(c, uLight * pow(l, 1.6) * .55);

  /* Coloured clouds of light moving across the picture. */
  float wash = fbm(vUv * vec2(aspect, 1.) * 1.5 + vec2(t * .05, -t * .03));
  c = screen(c, uShadow * smoothstep(.42, .72, wash) * .42);
  c = screen(c, uLight * smoothstep(.5, .78, 1. - wash) * .3);

  /* Shafts of light from a high window, turning slowly. */
  vec2 ray = (vUv - vec2(.82, 1.12)) * vec2(aspect, 1.);
  float ang = atan(ray.y, ray.x);
  float shaft = smoothstep(.46, .8, n(vec2(ang * 7. + t * .09, t * .05))) * smoothstep(1.9, .15, length(ray));
  c = screen(c, mix(uLight, vec3(1., .96, .85), .4) * shaft * .62);

  /* Embers rising through the light. */
  for (int i = 0; i < 2; i++) {
    float k = float(i);
    vec2 g = vUv * vec2(aspect, 1.) * (9. + k * 7.) + vec2(sin(t * .13 + k) * .6, -t * (.16 + k * .05));
    vec2 id = floor(g);
    float r = h(id + k * 13.);
    if (r > .72) {
      vec2 off = vec2(h(id + 2.), h(id + 5.)) - .5;
      float d = length(fract(g) - .5 - off * .6);
      float twinkle = .5 + .5 * sin(t * 1.6 + r * 60.);
      c += mix(uLight, uShadow, step(.86, r)) * smoothstep(.09, 0., d) * twinkle * 1.1;
    }
  }

  gl_FragColor = vec4(c, 1.);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("createShader failed");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader did not compile");
  return s;
}

function parseFocus(focus: string): [number, number] {
  const [x = "50", y = "50"] = focus.split(" ");
  // Texture v runs upwards, CSS object-position downwards.
  return [parseFloat(x) / 100, 1 - parseFloat(y) / 100];
}

export function LivingPicture({ picture, shadow, light, priority = false, sizes = "100vw", className = "" }: {
  picture: Picture; shadow: string; light: string; priority?: boolean; sizes?: string; className?: string;
}) {
  const img = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useCinemaStill();

  useEffect(() => {
    const el = canvas.current, image = img.current;
    if (!el || !image) return;
    const gl = el.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" });
    if (!gl) return; // No WebGL: the painting stays as it is.

    let raf = 0, last = 0, clock = 0, visible = true, ready = false, dead = false;
    const giveUp = (why: unknown) => {
      dead = true;
      cancelAnimationFrame(raf);
      el.style.display = "none";
      console.warn("LivingPicture: showing the still painting.", why);
    };
    let uni: Record<string, WebGLUniformLocation | null> = {};

    const resize = () => {
      const w = Math.min(el.clientWidth, 1280), h = Math.max(1, Math.round((el.clientHeight / Math.max(el.clientWidth, 1)) * w));
      if (el.width !== w) el.width = w;
      if (el.height !== h) el.height = h;
      // Set every time: a program rebuilt on the same canvas starts with a resolution of zero.
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uni.uRes!, w, h);
    };

    const draw = () => {
      resize();
      const r = el.getBoundingClientRect();
      gl.uniform1f(uni.uScroll!, Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1));
      gl.uniform1f(uni.uTime!, clock);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 32) return;
      clock += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw();
    };

    const start = () => {
      if (dead || ready) return;
      try {
        const prog = gl.createProgram();
        if (!prog) throw new Error("createProgram failed");
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "program did not link");
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const a = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        uni = Object.fromEntries(["uImg", "uRes", "uImgSize", "uFocus", "uTime", "uScroll", "uShadow", "uLight"].map((n) => [n, gl.getUniformLocation(prog, n)]));

        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        gl.uniform2f(uni.uImgSize!, image.naturalWidth, image.naturalHeight);
        gl.uniform2f(uni.uFocus!, ...parseFocus(picture.focus));
        gl.uniform3f(uni.uShadow!, ...hexToRgb(shadow));
        gl.uniform3f(uni.uLight!, ...hexToRgb(light));
        gl.uniform1i(uni.uImg!, 0);
        ready = true;
        // A held moment for the still frame, with the light already across the picture.
        clock = 12;
        draw();
        el.dataset.ready = "true";
        if (!still) raf = requestAnimationFrame(loop);
      } catch (e) {
        giveUp(e);
      }
    };

    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; }, { rootMargin: "80px" });
    io.observe(el);
    const ro = new ResizeObserver(() => { if (ready && !dead) draw(); });
    ro.observe(el);
    const lost = (e: Event) => { e.preventDefault(); giveUp("graphics context lost"); };
    el.addEventListener("webglcontextlost", lost);

    if (image.complete && image.naturalWidth > 0) start();
    else image.addEventListener("load", start, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("webglcontextlost", lost);
      image.removeEventListener("load", start);
      // Browsers cap live contexts, so free this one, but only once the canvas has really left
      // the page: React may run this effect again on the same canvas, and a lost context is final.
      setTimeout(() => { if (!el.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext(); }, 0);
    };
    // `still`, the colours and the picture restart the program: a lost context cannot be reused,
    // so the canvas is remounted through its key below.
  }, [picture, shadow, light, still]);

  return (
    <div className={`living absolute inset-0 -z-10 ${className}`}>
      <Image ref={img} src={picture.src} alt={picture.alt} fill priority={priority} placeholder="blur" sizes={sizes}
        className="living__still object-cover" style={{ objectPosition: picture.focus }} />
      <canvas key={`${picture.focus}${shadow}${light}${still}`} ref={canvas} aria-hidden="true" className="living__canvas absolute inset-0 h-full w-full" />
    </div>
  );
}
