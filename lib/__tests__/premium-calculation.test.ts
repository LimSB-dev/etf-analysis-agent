import { describe, expect, test } from "vitest";
import { calculatePremiumResult } from "../premium-calculation";

describe("lib/premium-calculation.calculatePremiumResult", () => {
  test("유효하지 않은 입력이면 null을 반환한다", () => {
    const result = calculatePremiumResult(
      {
        etfCurrent: "-1",
        nav: "100",
        qqqPrev: "0.9",
        qqqAfter: "1.0",
        fxPrev: "1",
        fxNow: "1.1",
        etfPrev: "0",
      },
      {},
    );
    expect(result).toBeNull();
  });

  test("임계값 사이이면 HOLD를 반환한다", () => {
    const source = {
      etfCurrent: "105",
      nav: "100",
      qqqPrev: "0.9",
      qqqAfter: "1.0",
      fxPrev: "1",
      fxNow: "1.1",
      etfPrev: "0",
    };

    const result = calculatePremiumResult(source, {
      buyThreshold: -20,
      sellThreshold: 10,
    });

    expect(result).not.toBeNull();

    // iNav = 100 * (1 + 1/9) * 1.1 = 122.222...
    // premium = (105 - 122.222...) / 122.222... * 100 ~= -14.0909...
    expect(result!.signal).toBe("HOLD");
    expect(result!.iNav).toBeCloseTo(122.222222, 6);
    expect(result!.premium).toBeCloseTo(-14.0909091, 6);
  });

  test("임계값 이하이면 BUY를 반환한다", () => {
    const source = {
      etfCurrent: "105",
      nav: "100",
      qqqPrev: "0.9",
      qqqAfter: "1.0",
      fxPrev: "1",
      fxNow: "1.1",
      etfPrev: "0",
    };

    const result = calculatePremiumResult(source, {
      buyThreshold: -5,
      sellThreshold: 20,
    });

    expect(result).not.toBeNull();
    expect(result!.signal).toBe("BUY");
  });

  test("임계값 이상이면 SELL를 반환한다", () => {
    const source = {
      etfCurrent: "140",
      nav: "100",
      qqqPrev: "0.9",
      qqqAfter: "1.0",
      fxPrev: "1",
      fxNow: "1.1",
      etfPrev: "0",
    };

    const result = calculatePremiumResult(source, {
      buyThreshold: -20,
      sellThreshold: 5,
    });

    expect(result).not.toBeNull();
    expect(result!.signal).toBe("SELL");
    expect(result!.premium).toBeGreaterThanOrEqual(5);
  });
});

