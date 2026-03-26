import { test, expect } from "@playwright/test";
import { t } from "./test-i18n";
import {
  localeInitPayload,
  getLocaleInitScript,
} from "./helpers/test-utils";
import { setupMypageMocks } from "./helpers/mypage-mock";

/** 인증된 마이페이지 본문 로드 대기 (섹션 제목 노출 기준) */
const waitForMypageContent = async (
  page: import("@playwright/test").Page,
  timeout = 15_000,
) => {
  await page.getByText(t.mypage.interestEtfList).waitFor({ state: "visible", timeout });
};

test.describe("마이페이지 비인증", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
  });

  test("비인증 시 /mypage 접속하면 / 로 리다이렉트된다", async ({ page }) => {
    await page.goto("/mypage", { waitUntil: "networkidle" });
    await expect(page).toHaveURL("/");
  });

  test("비인증 시 /mypage 직접 이동 후 홈에 머문다", async ({ page }) => {
    await page.goto("/");
    await page.goto("/mypage", { waitUntil: "networkidle" });
    await expect(page).toHaveURL("/");
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("비인증 시 헤더에 마이페이지 링크가 보이지 않는다", async ({
    page,
  }) => {
    await page.goto("/");
    const mypageLink = page.getByRole("link", { name: t.mypage.title });
    await expect(mypageLink).not.toBeVisible();
  });
});

test.describe("마이페이지 인증 (관심 리스트·구독)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
    await setupMypageMocks(page, { preferences: {}, telegramLinked: false });
  });

  test("마이페이지 진입 시 관심 ETF 리스트 섹션과 설명이 노출된다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL("/mypage");
    await waitForMypageContent(page);

    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(
      main.getByRole("heading", { level: 2, name: t.mypage.interestEtfList }),
    ).toBeVisible();
    await expect(main.getByText(t.mypage.description)).toBeVisible();
  });

  test("빈 관심 리스트일 때 빈 메시지가 노출된다", async ({ page }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    const main = page.getByRole("main");
    await expect(main).toContainText(t.mypage.emptyMessage);
  });

  test("텔레그램 구독 버튼이 노출된다", async ({ page }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    const subscribeButton = page.getByRole("button", {
      name: t.mypage.telegramAlertConnectA11y,
    });
    await expect(subscribeButton).toBeVisible();
  });

  test("수정 버튼 클릭 시 편집 모드로 전환되고 취소·저장 버튼이 노출된다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    await page.getByRole("button", { name: t.mypage.edit }).click();
    await expect(
      page.getByRole("button", { name: t.mypage.cancel }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.mypage.save }),
    ).toBeVisible();
  });

  test("편집 모드에서 관심 ETF 추가 UI(ETF 선택, 추가)가 노출된다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    await page.getByRole("button", { name: t.mypage.edit }).click();
    await expect(
      page.getByRole("combobox", { name: t.mypage.addEtfPlaceholder }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: t.mypage.addEtf }),
    ).toBeVisible();
  });
});

test.describe("마이페이지 인증 (관심 리스트에 데이터 있음)", () => {
  const mockPreferences = {
    "tiger-nas100": {
      buyPremiumThreshold: -1.5,
      sellPremiumThreshold: 1,
    },
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
    await setupMypageMocks(page, {
      preferences: mockPreferences,
      telegramLinked: false,
    });
  });

  test("관심 리스트에 ETF가 있으면 이름과 매수·매도 기준이 표시된다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    const main = page.getByRole("main");
    await expect(main).toContainText("TIGER 미국나스닥100");
    await expect(main).toContainText(t.mypage.buyThresholdLabel);
    await expect(main).toContainText(t.mypage.sellThresholdLabel);
  });

  test("수정 모드에서 ETF 행에 구독 해제(제거) 버튼이 있다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    await page.getByRole("button", { name: t.mypage.edit }).click();
    const removeButton = page.getByRole("button", {
      name: t.mypage.removeSubscriptionA11y,
    });
    await expect(removeButton).toBeVisible();
  });
});

test.describe("마이페이지 인증 (텔레그램 구독 연결됨)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(getLocaleInitScript(), localeInitPayload);
    await setupMypageMocks(page, {
      preferences: {},
      telegramLinked: true,
    });
  });

  test("텔레그램 연결 시 구독 취소 버튼이 노출된다", async ({ page }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    const unlinkButton = page.getByRole("button", {
      name: t.mypage.telegramUnlinkA11y,
    });
    await expect(unlinkButton).toBeVisible();
  });

  test("텔레그램 연결 시 증권사 딥링크를 선택하고 저장할 수 있다", async ({
    page,
  }) => {
    await page.goto("/mypage", { waitUntil: "domcontentloaded" });
    await waitForMypageContent(page);
    await page.getByTestId("test-mypage-broker-mirae").click();
    await page.getByRole("button", { name: t.mypage.save }).click();
    await expect(page.getByRole("status")).toHaveText(t.mypage.saved);
  });
});
