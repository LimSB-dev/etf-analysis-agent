import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/telegram", () => ({
  getWebhookInfo: vi.fn(),
}));

describe("app/api/telegram/webhook-info GET", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.CRON_SECRET = "secret";
  });

  afterEach(() => {
    if (originalSecret == null) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  test("Authorization 없으면 401", async () => {
    const req = new NextRequest("http://localhost/api/telegram/webhook-info");
    const { GET } = await import("./route");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test("Authorization이 맞으면 200 + payload", async () => {
    const telegram = await import("@/lib/telegram");
    vi.mocked(telegram.getWebhookInfo).mockResolvedValue({
      ok: true,
      info: { url: "x" },
    });

    const req = new NextRequest("http://localhost/api/telegram/webhook-info", {
      headers: { authorization: "Bearer secret" },
    });
    const { GET } = await import("./route");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, info: { url: "x" } });
  });

  test("내부 getWebhookInfo가 실패하면 502", async () => {
    const telegram = await import("@/lib/telegram");
    vi.mocked(telegram.getWebhookInfo).mockResolvedValue({
      ok: false,
      error: "boom",
    });

    const req = new NextRequest("http://localhost/api/telegram/webhook-info", {
      headers: { authorization: "Bearer secret" },
    });
    const { GET } = await import("./route");
    const res = await GET(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json).toEqual({ ok: false, error: "boom" });
  });
});

