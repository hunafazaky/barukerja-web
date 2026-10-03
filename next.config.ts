import type { NextConfig } from "next";

function getR2Hostname(): string | null {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim();
  if (!publicUrl) return null;

  try {
    const normalized = /^https?:\/\//.test(publicUrl)
      ? publicUrl
      : `https://${publicUrl}`;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

const r2Hostname = getR2Hostname();

// The real backend origin, WITHOUT a trailing slash and WITHOUT "/api".
// e.g. https://hz-reading-platform.onrender.com
// Server-side only (no NEXT_PUBLIC_ prefix) — the browser never sees it.
const backendUrl = process.env.BACKEND_API_URL?.trim()
  .replace(/\/+$/, "")
  // The old NEXT_PUBLIC_API_URL value ended in "/api", so it's easy to
  // paste that same value here. The rewrite below adds "/api" itself —
  // leaving it on would forward to /api/api/... and the backend would
  // answer "Route Not Found" for every request. Strip it defensively.
  .replace(/\/api$/, "");

if (!backendUrl) {
  // Without this, rewrites() below returns an empty array and every
  // "/api/..." call from the browser 404s against our own server
  // instead of reaching the backend — a confusing failure mode with no
  // error message pointing at the actual cause. Warn loudly instead.
  console.warn(
    "\n⚠️  BACKEND_API_URL is not set — API requests will 404. Copy .env.example to .env.local and fill it in.\n",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2Hostname
      ? [{ protocol: "https", hostname: r2Hostname }]
      : [],
  },

  // ==================================================
  // Same-origin proxy to the backend.
  //
  // The browser now calls /api/... on THIS site (vercel.app), and Next.js
  // forwards it to the Render backend on the server side. Because the
  // response comes back from our own origin, the refreshToken cookie is
  // stored as a first-party cookie — so it is sent on reload and isn't
  // affected by third-party-cookie blocking or SameSite rules.
  //
  // Files/route handlers win over rewrites, so app/api/upload/route.ts
  // (the R2 upload) keeps working and is never forwarded.
  // ==================================================
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
