/** Même origine : le navigateur ne reçoit jamais l'adresse privée du backend. */
const apiOrigin = process.env.API_ORIGIN || "http://127.0.0.1:8000";
const nextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*/` }];
  },
  async headers() {
    return ["/etudiant/:path*", "/edition/:path*"].map(source => ({ source, headers: [
      { key: "Cache-Control", value: "private, no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    ] }));
  },
};
export default nextConfig;
