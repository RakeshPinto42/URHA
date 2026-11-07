// URHA runs locally (bound to 127.0.0.1). Security headers are set anyway so the
// app is safe to put behind a proxy later; see docs/ARCHITECTURE.md §Security.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; dev needs eval for HMR.
  // wasm-unsafe-eval runs the Draco decoder: WebAssembly only, not JavaScript eval.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  // The Draco decoder runs in workers that three.js starts from a blob.
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // User-attached passage audio must be https (validated in lib/validate.ts).
  "media-src 'self' https:",
  // blob: is how three.js reads the textures unpacked from a GLB.
  `connect-src 'self' blob:${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
