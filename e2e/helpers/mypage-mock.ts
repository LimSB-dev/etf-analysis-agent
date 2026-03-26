import type { Page } from "@playwright/test";

/** 인증 세션 모킹용 더미 사용자 */
const MOCK_SESSION = {
  user: {
    id: "e2e-test-user-id",
    name: "E2E Test User",
    email: "e2e@test.com",
    image: null,
  },
  expires: "2099-12-31T00:00:00.000Z",
};

export type MypagePreferencesMockType = Record<
  string,
  { buyPremiumThreshold: number; sellPremiumThreshold: number }
>;

/**
 * 마이페이지 E2E에서 인증 + preferences API를 모킹한다.
 * 인증된 상태로 마이페이지를 테스트할 때 사용.
 */
export async function setupMypageMocks(
  page: Page,
  options: {
    preferences?: MypagePreferencesMockType;
    telegramLinked?: boolean;
    locale?: string | null;
    telegramBrokerLinkIds?: string[] | null;
  } = {},
): Promise<void> {
  const { preferences: seedPrefs = {}, telegramLinked = false } = options;

  let preferences: MypagePreferencesMockType = { ...seedPrefs };
  let telegramBrokerLinkIds: string[] | null =
    options.telegramBrokerLinkIds ?? null;

  // RegExp로 URL 매칭 (절대/상대 경로, req.url 불일치 방지)
  await page.route(/\/api\/auth\/session\/?(\?.*)?$/, (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    }
    return route.continue();
  });

  await page.route(/\/api\/mypage\/preferences\/?(\?.*)?$/, (route) => {
    const method = route.request().method();
    const body = {
      preferences,
      telegramLinked,
      locale: options.locale ?? null,
      telegramBrokerLinkIds,
    };
    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    }
    if (method === "PATCH") {
      try {
        const raw = route.request().postDataJSON() as {
          preferences?: MypagePreferencesMockType;
          telegramBrokerLinkIds?: string[];
        };
        if (raw.preferences != null) {
          preferences = { ...raw.preferences };
        }
        if (raw.telegramBrokerLinkIds !== undefined) {
          telegramBrokerLinkIds = [...raw.telegramBrokerLinkIds];
        }
      } catch {
        // ignore
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          preferences,
          telegramLinked,
          locale: options.locale ?? null,
          telegramBrokerLinkIds,
        }),
      });
    }
    return route.continue();
  });

  await page.route(/\/api\/mypage\/telegram-link\/?(\?.*)?$/, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://t.me/test_bot?start=token" }),
      });
    }
    return route.continue();
  });

  await page.route(/\/api\/mypage\/telegram-unlink\/?(\?.*)?$/, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({ status: 200 });
    }
    return route.continue();
  });
}
