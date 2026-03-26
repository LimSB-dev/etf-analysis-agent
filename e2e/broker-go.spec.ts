import { test, expect } from "@playwright/test"

const goUrl = (brokerId: "naver" | "toss", code = "123456") =>
  `/go/${brokerId}/${code}`

const iosUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
const androidUserAgent =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
const desktopUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"

test.describe("/go 브로커 앱 이동 (iOS)", () => {
  test.use({ userAgent: iosUserAgent })

  test("폴백 링크가 App Store로 설정된다 (naver)", async ({ page }) => {
    await page.goto(goUrl("naver"), { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/go\/naver\/123456$/)

    // Next dev 환경에서 간헐적으로 중복 노드가 잡힐 수 있어 첫 번째만 대상으로 한다.
    await expect(page.getByTestId("test-broker-go-main").first()).toBeVisible()
    await expect(page.getByTestId("test-broker-go-open-app")).toHaveAttribute(
      "href",
      "naversearchapp://stock/123456",
    )
    await expect(page.getByTestId("test-broker-go-fallback-store")).toHaveAttribute(
      "href",
      /apps\.apple\.com\/kr\/app\/naver\/id393499958/,
    )
  })
})

test.describe("/go 브로커 앱 이동 (Android)", () => {
  test.use({ userAgent: androidUserAgent })

  test("폴백 링크가 Play Store로 설정된다 (toss)", async ({ page }) => {
    await page.goto(goUrl("toss"), { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/go\/toss\/123456$/)

    await expect(page.getByTestId("test-broker-go-main").first()).toBeVisible()
    await expect(page.getByTestId("test-broker-go-open-app")).toHaveAttribute(
      "href",
      "tossinvest://stocks/A123456/order",
    )
    await expect(page.getByTestId("test-broker-go-fallback-store")).toHaveAttribute(
      "href",
      /play\.google\.com\/store\/apps\/details\?id=viva\.republica\.toss/,
    )
  })
})

test.describe("/go 브로커 앱 이동 (Desktop)", () => {
  test.use({ userAgent: desktopUserAgent })

  test("폴백 링크가 웹 URL로 설정된다 (naver)", async ({ page }) => {
    await page.goto(goUrl("naver"), { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/go\/naver\/123456$/)

    await expect(page.getByTestId("test-broker-go-main").first()).toBeVisible()
    await expect(page.getByTestId("test-broker-go-fallback-store")).toHaveAttribute(
      "href",
      "https://m.stock.naver.com/domestic/stock",
    )
  })
})

