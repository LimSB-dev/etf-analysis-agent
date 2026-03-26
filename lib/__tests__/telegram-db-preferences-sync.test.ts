import { describe, expect, test } from "vitest";

import {
  etfTickerToPreferenceId,
  subscribedTickersFromPreferences,
} from "../telegram-db-preferences-sync";

describe("lib/telegram-db-preferences-sync", () => {
  test("etfTickerToPreferenceId 는 네이버 코드 기준 ETF_OPTIONS id 를 반환한다", () => {
    expect(etfTickerToPreferenceId("133690")).toBe("tiger-nas100");
    expect(etfTickerToPreferenceId("999999")).toBeNull();
  });

  test("subscribedTickersFromPreferences 는 buy 가 있는 ETF만 티커로 변환한다", () => {
    expect(
      subscribedTickersFromPreferences({
        "tiger-nas100": {
          buyPremiumThreshold: -1,
          sellPremiumThreshold: 1,
        },
        "tiger-sp500": {
          buyPremiumThreshold: -1.5,
          sellPremiumThreshold: null,
        },
        bad: { buyPremiumThreshold: "x" } as never,
      }),
    ).toEqual(["133690", "360750"]);
  });
});
