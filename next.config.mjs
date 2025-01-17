import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    domains: ["images.openfoodfacts.org"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dk39fabs6/**",
      },
    ],
  },
  webpack: (config) => {
    if (config.resolve?.alias) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(process.cwd(), "src"),
      };
    }
    config.ignoreWarnings = [/DEP0040/];
    return config;
  },
};

export default nextConfig;
