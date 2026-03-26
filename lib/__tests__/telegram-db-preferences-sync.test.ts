import { describe, expect, test } from "vitest";

import { etfTickerToPreferenceId } from "../telegram-db-preferences-sync";

describe("lib/telegram-db-preferences-sync", () => {
  test("etfTickerToPreferenceId 는 네이버 코드 기준 ETF_OPTIONS id 를 반환한다", () => {
    expect(etfTickerToPreferenceId("133690")).toBe("tiger-nas100");
    expect(etfTickerToPreferenceId("999999")).toBeNull();
  });
});
