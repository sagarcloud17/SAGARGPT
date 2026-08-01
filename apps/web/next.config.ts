import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the Next.js "N" badge in the corner during `next dev`
  devIndicators: false,
};

export default nextConfig;
