/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  webpack: (config, { isServer }) => {
    // pdfjs v3 tries to import the Node-only "canvas" package.
    // The browser build does not need it. Aliasing it to false
    // tells webpack to ignore the import entirely.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false
    };
    return config;
  }
};

export default nextConfig;