import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 *
 * 환경 변수 (선택):
 * - PLAYWRIGHT_TEST_BASE_URL: 테스트 대상 URL (기본: http://localhost:3000)
 * - NO_WEB_SERVER: 1 이면 웹 서버를 기동하지 않음 (이미 서버가 떠 있을 때)
 *
 * 로컬에서 .env.local 적용된 앱으로 e2e 실행:
 *   터미널 1: npm run dev
 *   터미널 2: npm run test:e2e:local  (NO_WEB_SERVER=1 로 이미 떠 있는 서버 사용)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: [/calculator-data\.spec\.ts/],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: [/calculator-data\.spec\.ts/],
    },
  ],
  // CI: build 후 npm run start로 서버 기동. 로컬: dev 서버 또는 NO_WEB_SERVER=1 로 별도 기동
  webServer:
    process.env.NO_WEB_SERVER
      ? undefined
      : process.env.CI
        ? {
            command: "npm run start",
            url: "http://localhost:3000",
            reuseExistingServer: false,
            timeout: 120_000,
          }
        : {
            command: "npm run dev",
            url: "http://localhost:3000",
            reuseExistingServer: true,
            timeout: 120_000,
          },
});
