import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ztoitech.com",
      },
      {
        protocol: "http",
        hostname: "ztoitech.com",
      },
      {
        protocol: "https",
        hostname: "attendance.blickwinkle.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
