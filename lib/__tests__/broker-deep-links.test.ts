import { describe, expect, test, beforeEach, afterEach } from "vitest";
import {
  buildSubscriptionQuickLinksHtml,
  escapeHtml,
} from "../broker-deep-links";

describe("lib/broker-deep-links", () => {
  const envKey = "TELEGRAM_INCLUDE_BROKER_APP_SCHEMES";
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[envKey];
    delete process.env[envKey];
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = originalEnv;
    }
  });

  test("escapeHtml은 &, <, > 를 이스케이프한다", () => {
    expect(escapeHtml("<>&")).toBe("&lt;&gt;&amp;");
  });

  test("코드(6자리 숫자)가 아니면 빈 문자열을 반환한다", () => {
    expect(buildSubscriptionQuickLinksHtml("12345", "ko", ["naver"])).toBe(
      "",
    );
  });

  test("selectedBrokerIds가 주어지면 최대 5개만 포함한다", () => {
    const html = buildSubscriptionQuickLinksHtml(
      "123456",
      "ko",
      ["naver", "toss", "mirae", "kiwoom", "kb", "samsung", "hankook"],
    );

    expect(html).toContain("🔗 빠른 이동");
    expect(html).toContain("네이버 시세");
    expect(html).toContain("https://m.stock.naver.com/domestic/stock/123456/total");
    // MAX_QUICK_LINK_SELECTIONS = 5이므로 삼성/한국투자는 포함되면 안 됨
    expect(html).not.toContain("삼성");
    expect(html).not.toContain("한국투자");
  });

  test("selectedBrokerIds가 null일 때 환경변수가 꺼져있으면 빈 문자열을 반환한다", () => {
    process.env[envKey] = "0";
    const html = buildSubscriptionQuickLinksHtml("123456", "ko", null);
    expect(html).toBe("");
  });

  test("selectedBrokerIds가 null일 때 환경변수가 켜져있으면 전체 딥링크가 포함된다", () => {
    process.env[envKey] = "1";
    const html = buildSubscriptionQuickLinksHtml("123456", "ko", null);

    expect(html).toContain("🔗 빠른 이동");
    // 앱 딥링크도 "증권사 이름에 링크" 형태로 포함된다
    expect(html).toContain("<a href=\"miraeassetTrade://?code=123456\">미래에셋</a>");
  });

  test("locale이 en이면 제목이 영어로 바뀐다", () => {
    const html = buildSubscriptionQuickLinksHtml("123456", "en", ["naver"]);
    expect(html).toContain("🔗 Quick links");
    expect(html).toContain("Naver quote");
  });
});

