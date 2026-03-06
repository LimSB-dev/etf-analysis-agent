import { test, expect } from "@playwright/test";
import { t } from "./test-i18n";
import {
  parsePremiumFromText,
  localeInitPayload,
  getLocaleInitScript,
} from "./helpers/test-utils";

test.describe("데이터 호출 후 화면·로직·API 데이터 검증", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
  });

  test("시세 조회 후 API 데이터(ETF 현재가, iNAV, 기초지수)가 모두 화면에 반영된다", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    const resultSignal = page.getByText(
      new RegExp(`${t.buyAction}|${t.sellAction}|${t.holdAction}`),
    );
    await expect(resultSignal).toBeVisible({ timeout: 25_000 });

    const main = page.getByRole("main");

    await expect(main.getByText(t.currentPrice)).toBeVisible();
    await expect(main.getByText(t.realtimeEstimatedFairPrice)).toBeVisible();
    await expect(main.getByText(t.baseIndex)).toBeVisible();
    await expect(main.getByText(t.dataProvidedByNaver)).toBeVisible();

    const krwPattern = /₩[\d,]+/;
    await expect(main.locator(`text=${krwPattern}`).first()).toBeVisible();
  });

  test("시세 조회 후 결과 카드가 렌더링되고 신호·현재 프리미엄이 표시된다", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    const resultSignal = page.getByText(
      new RegExp(`${t.buyAction}|${t.sellAction}|${t.holdAction}`),
    );
    await expect(resultSignal).toBeVisible({ timeout: 25_000 });

    await expect(page.getByText(t.currentPremium)).toBeVisible();
    const premiumContainer = page
      .getByText(t.currentPremium)
      .locator("..")
      .locator("..");
    await expect(
      premiumContainer.getByText(/[-+]?\d+\.?\d*\s*%?/),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("표시된 신호와 프리미엄 값이 계산 로직에 맞다 (매수≤-1%, 매도≥1%, 관망 -1~1%)", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    const resultSignal = page.getByText(
      new RegExp(`${t.buyAction}|${t.sellAction}|${t.holdAction}`),
    );
    await expect(resultSignal).toBeVisible({ timeout: 25_000 });

    const signalText = await resultSignal.textContent();
    const premiumContainer = page
      .getByText(t.currentPremium)
      .locator("..")
      .locator("..");
    const premiumEl = premiumContainer.getByText(/[-+]?\d+\.?\d*\s*%?/);
    const premiumText = await premiumEl.first().textContent();
    const premium = parsePremiumFromText(premiumText);

    expect(premium).not.toBeNull();
    const premiumNum = premium as number;

    if (signalText?.includes(t.buyAction)) {
      expect(premiumNum).toBeLessThanOrEqual(-1);
    } else if (signalText?.includes(t.sellAction)) {
      expect(premiumNum).toBeGreaterThanOrEqual(1);
    } else if (signalText?.includes(t.holdAction)) {
      expect(premiumNum).toBeGreaterThan(-1);
      expect(premiumNum).toBeLessThan(1);
    }
  });

  test("결과 표시 후 상세 분석을 열면 iNAV·공식 NAV·수익률 등 계산 과정이 보인다", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    await expect(
      page.getByText(
        new RegExp(`${t.buyAction}|${t.sellAction}|${t.holdAction}`),
      ),
    ).toBeVisible({ timeout: 25_000 });

    const detailedButton = page.getByRole("button", {
      name: t.detailedAnalysis,
    });
    await detailedButton.click();

    await expect(page.getByText(t.iNavCalculation)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(t.officialNav)).toBeVisible();
    await expect(page.getByText(t.indexReturn)).toBeVisible();
    await expect(page.getByText(t.fxReturn)).toBeVisible();
  });

  test("시세 조회 후 상세 분석 보기·추가 탭·알람 배너가 노출된다", async ({
    page,
  }) => {
    await page.goto("/");
    const calculatorRegion = page.getByRole("region", {
      name: t.premiumAnalysis,
    });
    await calculatorRegion
      .getByRole("button", {
        name: new RegExp(`${t.autoFetchPrices}|${t.fetchingData}`),
      })
      .click();

    await expect(
      page.getByRole("button", { name: t.detailedAnalysis }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("region", { name: t.extraTabsRegionLabel }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole("main").getByText(t.realtimeAlertTitle),
    ).toBeVisible({ timeout: 5_000 });
  });
});
