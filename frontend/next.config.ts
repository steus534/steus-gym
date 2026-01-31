import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/community", destination: "/blog", permanent: true }];
  },
};

export default nextConfig;
