import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["10.83.134.150", "192.168.0.150"],
  turbopack: {},
};

export default withSerwist(nextConfig);
