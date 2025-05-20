// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimize for Cloud Run and Docker
  reactStrictMode: true,
  // swcMinify: true, // Turbopack enables this by default
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://placehold.co; font-src 'self'; connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com;",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          }
        ],
      },
    ];
  },
  experimental: {
    // allowedDevOrigins: ["https://*.cloudworkstations.dev", "http://localhost:9002"] // Updated for more flexibility
  },
  // Ensure swcMinify is true for production builds if not using Turbopack or to be explicit.
  // Turbopack (used with `next dev --turbopack`) handles this automatically.
  // For production builds (`next build`), explicitly setting `swcMinify: true` is good practice.
  // However, since Turbopack is used for dev, this might not be strictly necessary for dev.
  // swcMinify: true, 
};

export default nextConfig;
