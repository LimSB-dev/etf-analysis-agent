import { test, expect } from "@playwright/test";
import { t } from "./test-i18n";
import { localeInitPayload, getLocaleInitScript } from "./helpers/test-utils";

test.describe("홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
  });

  test("페이지 타이틀과 메인 영역이 노출된다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(new RegExp(t.pageTitle));
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("페이지 헤더에 h1(페이지 타이틀)과 서비스 소개 링크가 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.getByRole("banner", { name: t.pageTitle });
    await expect(header).toBeVisible();

    const h1 = header.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(t.pageTitle);

    const aboutLink = header.getByRole("link", {
      name: t.headerServiceDescription,
    });
    await expect(aboutLink).toHaveAttribute("href", "/about");
  });

  test("ETF 계산기 영역에 프리미엄 분석 제목과 시세 조회 버튼이 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await expect(calculatorRegion).toBeVisible();
    await expect(
      calculatorRegion.getByRole("heading", { level: 2 }),
    ).toHaveText(t.premiumAnalysis);
    await expect(
      calculatorRegion.getByRole("button", { name: t.autoFetchPrices }),
    ).toBeVisible();
  });

  test("ETF 선택 콤보박스가 있고 라벨이 노출된다", async ({ page }) => {
    await page.goto("/");

    const etfSelect = page.getByRole("combobox", {
      name: t.selectEtf,
    });
    await expect(etfSelect).toBeVisible();
  });

  test("ETF 선택 시 옵션을 변경할 수 있다", async ({ page }) => {
    await page.goto("/");

    const etfSelect = page.getByRole("combobox", { name: t.selectEtf });
    await expect(etfSelect).toBeVisible();

    const initialValue = await etfSelect.inputValue();
    await etfSelect.selectOption({ index: 1 });
    const afterValue = await etfSelect.inputValue();
    expect(afterValue).toBeTruthy();
    expect(afterValue).not.toBe(initialValue);
  });

  test("테마 변경 버튼과 언어 전환 버튼이 있다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: t.themeToggleLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.localeSwitchToEn }),
    ).toBeVisible();
  });

  test("푸터가 있고 저작권·Canary Lab·GitHub 링크가 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("©");
    await expect(
      footer.getByRole("link", { name: t.footer.canaryLabBlog }),
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: t.footer.githubProfile }),
    ).toBeVisible();
  });
});
