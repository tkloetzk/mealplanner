import type { Configuration } from "webpack";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    domains: ["images.openfoodfacts.org"], // Add the domain here
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dk39fabs6/**",
      },
    ],
  },
  webpack: (config: Configuration) => {
    if (config.resolve?.alias) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname, "src"),
      };
    }
    return config;
  },
};

export default nextConfig;
