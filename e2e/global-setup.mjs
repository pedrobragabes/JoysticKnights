import nextEnv from "@next/env";
import { discoverEditorialFixtures } from "../scripts/editorial-fixtures.mjs";

const { loadEnvConfig } = nextEnv;

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  const fixture = await discoverEditorialFixtures();
  process.env.E2E_EDITORIAL_FIXTURE = JSON.stringify(fixture);
  console.log(`[e2e] ${fixture.siteName}: ${fixture.story.path} | ${fixture.page.path}`);
}
