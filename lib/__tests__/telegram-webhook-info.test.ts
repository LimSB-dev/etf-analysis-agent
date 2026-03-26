import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { getWebhookInfo } from "../telegram";

describe("lib/telegram.getWebhookInfo", () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
  });

  afterEach(() => {
    if (originalToken == null) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    }
  });

  test("TELEGRAM_BOT_TOKEN이 없으면 ok:false", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const result = await getWebhookInfo();
    expect(result.ok).toBe(false);
  });

  test("getWebhookInfo 호출이 성공하면 ok:true로 result를 반환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ ok: true, result: { url: "https://example.com" } }),
      })) as unknown as typeof fetch,
    );

    const result = await getWebhookInfo();
    expect(result).toEqual({ ok: true, info: { url: "https://example.com" } });
  });

  test("Telegram API가 ok:false면 ok:false + description 반환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ ok: false, description: "bad token" }),
      })) as unknown as typeof fetch,
    );

    const result = await getWebhookInfo();
    expect(result).toEqual({ ok: false, error: "bad token" });
  });

  test("네트워크 에러면 ok:false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }) as unknown as typeof fetch,
    );

    const result = await getWebhookInfo();
    expect(result).toEqual({ ok: false, error: "network" });
  });
});

