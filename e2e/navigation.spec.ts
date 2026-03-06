import { test, expect } from "@playwright/test";
import { t } from "./test-i18n";
import { localeInitPayload, getLocaleInitScript } from "./helpers/test-utils";

test.describe("네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
  });

  test("홈에서 서비스 소개 링크 클릭 시 About 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .getByRole("link", { name: t.headerServiceDescription })
      .click();
    await expect(page).toHaveURL("/about");
    await expect(
      page
        .getByRole("article", { name: t.about.title })
        .getByRole("heading", { level: 1 }),
    ).toHaveText(t.about.title);
  });
});
