import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  // CI: 서버 없음(별도 구동). 로컬: 이미 서버가 떠 있으면 재사용(reuseExistingServer).
  // 로컬에서 dev 서버를 직접 켜둔 채 테스트만 하려면: NO_WEB_SERVER=1 npm run test:e2e
  webServer:
    process.env.CI || process.env.NO_WEB_SERVER
      ? undefined
      : {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
});
