/** Même origine : le navigateur ne reçoit jamais l'adresse privée du backend. */
const apiOrigin = process.env.API_ORIGIN || "http://127.0.0.1:8000";
const nextConfig = {
  skipTrailingSlashRedirect: true,
  // Import de séries : un .zip d’audios dépasse vite les 10 Mo transmis par défaut au backend.
  experimental: { middlewareClientMaxBodySize: "250mb" },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*/` },
      // Administration Django servie sur la même origine que le site.
      { source: "/admin", destination: `${apiOrigin}/admin/` },
      { source: "/admin/:path*", destination: `${apiOrigin}/admin/:path*/` },
      { source: "/static/admin/:path*", destination: `${apiOrigin}/static/admin/:path*` },
    ];
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
