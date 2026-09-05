import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "");
const baseURL = externalBaseUrl ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.mjs",
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBaseUrl ? undefined : {
    command: "npm run build && npm run start -- --port 3100",
    url: baseURL,
    env: {
      DRAFT_MODE_SECRET: "e2e-draft-secret",
      REVALIDATE_SECRET: "e2e-revalidate-secret",
      NEXT_PUBLIC_SITE_PROFILE: "joysticknights",
      NEXT_PUBLIC_SITE_URL: baseURL,
    },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
