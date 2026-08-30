import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@zerocorp/site-renderer",
    "@zerocorp/design-system",
    "@zerocorp/application",
    "@zerocorp/contracts",
    "@zerocorp/config",
    "@zerocorp/tenancy",
    "@zerocorp/db",
  ],
};

export default config;
