import { describe, expect, test } from "vitest";
import { calculateFairValue } from "../calculateFairValue";

describe("lib/calculateFairValue.calculateFairValue", () => {
  test("fairValue가 0 이하일 때 premium은 0으로 고정되고 HOLD가 반환된다", () => {
    const result = calculateFairValue(100, -100, 0, 0);
    expect(result.premium).toBe(0);
    expect(result.signal).toBe("HOLD");
  });

  test("premium이 buyThreshold 이하이면 BUY를 반환한다", () => {
    // fairValue = 100 * 1.1 * 1.05 = 115.5
    // premium = (100 - 115.5) / 115.5 * 100 ~= -13.0
    const result = calculateFairValue(100, 100, 0.1, 0.05);
    expect(result.signal).toBe("BUY");
    expect(result.premium).toBeLessThanOrEqual(-1);
  });

  test("premium이 임계값 사이이면 HOLD를 반환한다", () => {
    const prevClose = 100;
    const indexReturn = 0.1;
    const fxReturn = 0.05;
    const fairValue = prevClose * (1 + indexReturn) * (1 + fxReturn); // 115.5

    // premium ~= +0.5%
    const price = fairValue * (1 + 0.005);
    const result = calculateFairValue(price, prevClose, indexReturn, fxReturn);

    expect(result.signal).toBe("HOLD");
    expect(result.premium).toBeGreaterThan(-1);
    expect(result.premium).toBeLessThan(1);
  });

  test("premium이 sellThreshold 이상이면 SELL를 반환한다", () => {
    // fairValue = 100 * 1.0 * 1.0 = 100
    const result = calculateFairValue(106, 100, 0, 0, { buyThreshold: -1, sellThreshold: 5 });
    expect(result.signal).toBe("SELL");
    expect(result.premium).toBeGreaterThanOrEqual(5);
  });
});

