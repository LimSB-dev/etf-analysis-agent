import { test, expect } from "@playwright/test";
import { t } from "./test-i18n";
import { localeInitPayload, getLocaleInitScript } from "./helpers/test-utils";

test.describe("About 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
  });

  test("메인으로 돌아가기 링크와 h1이 있다", async ({ page }) => {
    await page.goto("/about");

    const main = page.getByRole("main");
    await expect(main).toBeVisible();

    const backLink = main.getByRole("link", { name: t.about.backToHome });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");

    const h1 = main.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(t.about.title);
  });

  test("섹션 제목들이 노출된다", async ({ page }) => {
    await page.goto("/about");

    const article = page.getByRole("article", { name: t.about.title });
    await expect(article).toBeVisible();
    const h2List = article.getByRole("heading", { level: 2 });
    await expect(h2List.first()).toBeVisible();
    await expect(h2List).toHaveCount(4);
  });

  test("메인으로 돌아가기 클릭 시 홈으로 이동한다", async ({ page }) => {
    await page.goto("/about");
    await page
      .getByRole("main")
      .getByRole("link", { name: t.about.backToHome })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("main")).toBeVisible();
  });
});
