/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Add polyfills and fallbacks
    config.resolve.fallback = { 
      fs: false, 
      path: false,
      crypto: false 
    };
    return config;
  },
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },
  // Handle transpilation of external modules if needed
  transpilePackages: ['d3', 'topojson-client']
}

module.exports = nextConfig 