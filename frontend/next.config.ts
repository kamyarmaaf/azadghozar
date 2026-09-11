import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  turbopack: {
    root: process.cwd(),
  },

  allowedDevOrigins: [
    "192.168.133.1",
  ],
};

export default nextConfig;
