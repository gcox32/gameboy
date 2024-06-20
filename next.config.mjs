/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'assets.letmedemo.com',
          port: '',
          pathname: '/public/**',
        },
      ],
    },
  }
export default nextConfig;
