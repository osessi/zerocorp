import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@zerocorp/ui",
    "@zerocorp/design-system",
    "@zerocorp/application",
    "@zerocorp/contracts",
    "@zerocorp/config",
    "@zerocorp/tenancy",
    "@zerocorp/auth",
    "@zerocorp/billing",
    "@zerocorp/notifications",
    "@zerocorp/security",
    "@zerocorp/db",
  ],
};

export default config;
