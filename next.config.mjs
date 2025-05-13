
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // experimental: {
  //   allowedDevOrigins: [
  //     // Example: Add your Cloud Workstations preview URL if facing CORS issues during development.
  //     // 'https://*.cloudworkstations.dev', 
  //   ],
  // },
  // swcMinify has been removed as it's default true in Next.js 13+ and not a recognized experimental key
};

export default nextConfig;
