/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cho phép Cloudflare Tunnel và các reverse proxy truy cập dev server
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost'],
}

export default nextConfig
