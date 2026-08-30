import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
  },
  // If deployed with a base path on GitHub pages without custom domain, can be injected via env
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
};

export default nextConfig;

