import { test, expect } from "@playwright/test";
import { t, localeStorageKey } from "./test-i18n";

test.describe("홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (payload: { key: string; value: string }) =>
        localStorage.setItem(payload.key, payload.value),
      { key: localeStorageKey, value: "ko" },
    );
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

    const aboutLink = header.getByRole("link", { name: t.headerServiceDescription });
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

  test("시세 조회 후 상세 분석 보기 버튼이 있고 클릭 시 펼쳐진다", async ({
    page,
  }) => {
    await page.goto("/");
    const region = page.getByRole("region", { name: t.premiumAnalysis });
    await region
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    const detailedButton = page.getByRole("button", {
      name: t.detailedAnalysis,
    });
    await expect(detailedButton).toBeVisible({ timeout: 20_000 });
    await detailedButton.click();
    await expect(page.getByText(t.iNavCalculation)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("시세 조회 후 추가 탭(프리미엄 추이, 전략 시뮬레이션, 같은 지수 ETF 비교)이 노출된다", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", { name: t.premiumAnalysis });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    const extraSection = page.getByRole("region", {
      name: t.extraTabsRegionLabel,
    });
    await expect(extraSection).toBeVisible({ timeout: 20_000 });
    await expect(
      extraSection.getByRole("button", { name: t.premiumTrendTab }),
    ).toBeVisible();
    await expect(
      extraSection.getByRole("button", { name: t.strategySimulationTab }),
    ).toBeVisible();
    await expect(
      extraSection.getByRole("button", { name: t.sameIndexComparisonTab }),
    ).toBeVisible();
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

  test("시세 조회 후 알람 배너 제목이 노출된다", async ({ page }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", { name: t.premiumAnalysis });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();
    await expect(
      page.getByRole("main").getByText(t.realtimeAlertTitle),
    ).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("About 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (payload: { key: string; value: string }) =>
        localStorage.setItem(payload.key, payload.value),
      { key: localeStorageKey, value: "ko" },
    );
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

test.describe("네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (payload: { key: string; value: string }) =>
        localStorage.setItem(payload.key, payload.value),
      { key: localeStorageKey, value: "ko" },
    );
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
