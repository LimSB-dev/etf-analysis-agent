import { test, expect } from "@playwright/test";

/** 한/영 공통으로 매칭하기 위한 패턴 */
const patterns = {
  pageTitle: /ETF\s*(프리미엄|Premium).*(분석|Analysis)|ETF Premium Analysis Platform|ETF 프리미엄 분석 플랫폼/,
  aboutLink: /서비스 소개|About this service/,
  premiumAnalysisHeading: /프리미엄 분석|Real-Time Analysis/,
  fetchPricesButton: /실시간 시세 조회|Fetch Latest Prices|시세 조회 중|Fetching Prices/,
  selectEtfLabel: /분석할 ETF 선택|Select ETF to Analyze/,
  detailedAnalysis: /상세 분석 보기|Detailed Analysis/,
  premiumTrendTab: /프리미엄 추이|Premium Trend/,
  strategySimulationTab: /전략 시뮬레이션|Strategy Simulation/,
  sameIndexComparisonTab: /같은 지수 ETF 비교|Same Index ETF Compare/,
  alertBannerTitle: /실시간 매수\/매도 알람|real-time buy\/sell alerts?/i,
  backToHome: /메인으로 돌아가기|Back to home/,
  aboutTitle: /서비스 소개|About this service/,
  themeToggle: /테마 변경|Change theme/,
  localeSwitchKo: /한국어로 전환/,
  localeSwitchEn: /Switch to English/,
};

test.describe("홈 페이지", () => {
  test("페이지 타이틀과 메인 영역이 노출된다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/ETF|Premium|Analysis|프리미엄|분석/i);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("페이지 헤더에 h1(페이지 타이틀)과 서비스 소개 링크가 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    await expect(main).toBeVisible();

    const h1 = main.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(patterns.pageTitle);

    const aboutLink = main.getByRole("link", { name: patterns.aboutLink });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute("href", "/about");
  });

  test("ETF 계산기 영역에 프리미엄 분석 제목과 시세 조회 버튼이 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", {
        level: 2,
        name: patterns.premiumAnalysisHeading,
      }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: patterns.fetchPricesButton }),
    ).toBeVisible();
  });

  test("ETF 선택 콤보박스가 있고 라벨이 노출된다", async ({ page }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    const etfSelect = main.getByRole("combobox").first();
    await expect(etfSelect).toBeVisible();
    await expect(main.getByText(patterns.selectEtfLabel)).toBeVisible();
  });

  test("ETF 선택 시 옵션을 변경할 수 있다", async ({ page }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    const etfSelect = main.getByRole("combobox").first();
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
    const main = page.getByRole("main");
    await main.getByRole("button", { name: patterns.fetchPricesButton }).click();

    const detailedButton = main.getByRole("button", {
      name: patterns.detailedAnalysis,
    });
    await expect(detailedButton).toBeVisible({ timeout: 20_000 });
    await detailedButton.click();
    await expect(
      main.getByText(/iNAV|NAV|지수 수익률|index return/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("시세 조회 후 추가 탭(프리미엄 추이, 전략 시뮬레이션, 같은 지수 ETF 비교)이 노출된다", async ({
    page,
  }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await main.getByRole("button", { name: patterns.fetchPricesButton }).click();

    const premiumTab = main.getByRole("button", { name: patterns.premiumTrendTab });
    await expect(premiumTab).toBeVisible({ timeout: 20_000 });
    await expect(
      main.getByRole("button", { name: patterns.strategySimulationTab }),
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: patterns.sameIndexComparisonTab }),
    ).toBeVisible();
  });

  test("테마 변경 버튼과 언어 전환 버튼이 있다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: patterns.themeToggle }),
    ).toBeVisible();
    const localeButton = page.getByRole("button", {
      name: new RegExp(
        `${patterns.localeSwitchKo.source}|${patterns.localeSwitchEn.source}`,
      ),
    });
    await expect(localeButton).toBeVisible();
  });

  test("푸터가 있고 저작권·Canary Lab·GitHub 링크가 있다", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("©");
    await expect(footer.getByRole("link", { name: /Canary Lab/ })).toBeVisible();
    await expect(footer.getByRole("link", { name: /GitHub/ })).toBeVisible();
  });

  test("시세 조회 후 알람 배너 제목이 노출된다", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await main.getByRole("button", { name: patterns.fetchPricesButton }).click();
    await expect(main.getByText(patterns.alertBannerTitle)).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("About 페이지", () => {
  test("메인으로 돌아가기 링크와 h1이 있다", async ({ page }) => {
    await page.goto("/about");

    const main = page.getByRole("main");
    await expect(main).toBeVisible();

    const backLink = main.getByRole("link", { name: patterns.backToHome });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");

    const h1 = main.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(patterns.aboutTitle);
  });

  test("섹션 제목들이 노출된다", async ({ page }) => {
    await page.goto("/about");

    const main = page.getByRole("main");
    const h2List = main.getByRole("heading", { level: 2 });
    await expect(h2List.first()).toBeVisible();
    await expect(h2List).toHaveCount(4);
  });

  test("메인으로 돌아가기 클릭 시 홈으로 이동한다", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("main").getByRole("link", { name: patterns.backToHome }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("네비게이션", () => {
  test("홈에서 서비스 소개 링크 클릭 시 About 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: patterns.aboutLink })
      .click();
    await expect(page).toHaveURL("/about");
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveText(patterns.aboutTitle);
  });
});
