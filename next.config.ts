import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/extension-accelerate",
    "prisma",
    ".prisma/client",
  ],
};

export default nextConfig;