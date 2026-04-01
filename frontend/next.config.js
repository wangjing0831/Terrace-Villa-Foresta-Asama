/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'd143jkdkye8i79.cloudfront.net',
      },
    ],
    // ECS runs in private subnet with no NAT — cannot fetch external URLs
    // server-side for optimization. Set unoptimized:true so <Image> renders
    // the src URL directly; browser fetches from CloudFront without proxying.
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '/media',
  },
};

module.exports = nextConfig;
