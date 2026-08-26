/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization to prevent segfault during build
  output: 'standalone',
  productionBrowserSourceMaps: false,
};

export default nextConfig;
