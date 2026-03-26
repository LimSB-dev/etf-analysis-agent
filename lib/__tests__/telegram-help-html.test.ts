import { describe, expect, test } from "vitest";

import { buildTelegramHelpHtml } from "../telegram-help";

describe("lib/telegram-help.buildTelegramHelpHtml", () => {
  test("한국어 본문에 /subscribe·마이페이지 동기 안내가 포함된다", () => {
    const site = "https://etf-analysis-agent.vercel.app";
    const html = buildTelegramHelpHtml("ko", site, "https://t.me/example");
    expect(html).toContain("/subscribe");
    expect(html).toContain("/mypage");
    expect(html).toContain("기본값");
    expect(html).not.toContain("v0-etf-analysis-agent.vercel.app");
  });

  test("영어 본문에 subscribe·My page 동기 안내가 포함된다", () => {
    const site = "https://etf-analysis-agent.vercel.app";
    const html = buildTelegramHelpHtml("en", site, "https://t.me/example");
    expect(html).toContain("/subscribe");
    expect(html).toContain("defaults");
    expect(html).toContain("/mypage");
  });
});
