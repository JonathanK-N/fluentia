/** Même origine : le navigateur ne reçoit jamais l'adresse privée du backend. */
const apiOrigin = process.env.API_ORIGIN || "http://127.0.0.1:8000";
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` }];
  },
  async headers() {
    return [{ source: "/etudiant/:path*", headers: [
      { key: "Cache-Control", value: "private, no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ] }];
  },
};
export default nextConfig;
