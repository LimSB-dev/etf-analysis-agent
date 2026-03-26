import { describe, expect, test, vi, beforeEach } from "vitest";

import { buildTelegramSubscribedPremiumSnapshotHtml } from "../telegram-help";

vi.mock("@/lib/getEtfList", () => ({
  getEtfList: vi.fn(async () => [
    {
      ticker: "133690",
      name: "TIGER 미국나스닥100",
      price: 100,
      fairValue: 100,
      premium: 1.23,
      signal: "HOLD",
      updatedAt: new Date().toISOString(),
    },
    {
      ticker: "360750",
      name: "TIGER 미국S&P500",
      price: 200,
      fairValue: 200,
      premium: -0.5,
      signal: "BUY",
      updatedAt: new Date().toISOString(),
    },
  ]),
}));

describe("lib/telegram-help.buildTelegramSubscribedPremiumSnapshotHtml", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("구독 tickers가 비어있으면 ok:false", async () => {
    const res = await buildTelegramSubscribedPremiumSnapshotHtml("ko", []);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain("/subscribe");
    }
  });

  test("구독 tickers만 포함해 스냅샷을 만든다", async () => {
    const res = await buildTelegramSubscribedPremiumSnapshotHtml("ko", [
      "133690",
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.html).toContain("내 구독 괴리율");
      expect(res.html).toContain("TIGER 미국나스닥100");
      expect(res.html).not.toContain("TIGER 미국S&P500");
    }
  });
});

