import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@prisma/client", "pg", "pg-connection-string"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        pg: false,
        "pg-native": false,
        "pg-connection-string": false,
      };
    }
    return config;
  },
};

export default nextConfig;
