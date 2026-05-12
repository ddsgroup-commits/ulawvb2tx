import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google profile pics
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
  experimental: {
    // For server actions
    serverActions: {
      allowedOrigins: ["localhost:3000", "portal.srv1559779.hstgr.cloud"],
    },
  },
};

export default nextConfig;
