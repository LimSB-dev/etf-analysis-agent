# ETF 프리미엄 분석 플랫폼 (ETF Premium Analysis)

한국 상장 미국 ETF(TIGER, KODEX, ACE 등)의 **프리미엄(괴리율)**을 실시간으로 분석하고, 매수/매도 신호와 과거 추이·전략 시뮬레이션을 제공하는 웹 애플리케이션입니다.

## 주요 기능

### 프리미엄 분석
- **다양한 ETF 지원**: Nasdaq 100(NDX), S&P 500(SPX), 필라델피아 반도체(SOX) 추종 국내 상장 ETF 분석
- **기초지수**: ETF가 아닌 **실제 지수**(NDX, SPX, SOX) 기준으로 조회해 더 정확한 계산
- **실시간 데이터 조회**: 네이버 금융 API를 통한 ETF 현재가·NAV, 기초지수(NDX, SPX, SOX), 환율 자동 조회
- **iNAV·적정가 계산**: 전일 NAV와 기초지수 수익률·환율 변동을 반영한 실시간 추정 가격(iNAV) 산출
- **매매 신호**: 프리미엄 기준 BUY(≤ -1%) / SELL(≥ +1%) / HOLD(-1% ~ +1%) 신호 및 설명
- **상세 분석 접기/펼치기**: iNAV 계산 과정, 분석 요약, 공식 정리 블록

### 프리미엄 추이 (탭)
- **과거 30일 프리미엄 차트**: 기간별 프리미엄 추이 시각화(Recharts AreaChart)
- **통계 요약**: 현재값, 최고/최저/평균, 백분위(저평가·고평가 구간 표시)

### 전략 시뮬레이션 (탭)
- **백테스트**: 1개월 / 3개월 / 약 6개월 기간 선택
- **매매 전략 설정**: 매수·매도 임계값(프리미엄 % 이하/이상) 사용자 지정
- **성과 비교**: 전략 수익률 vs 단순 보유 수익률, 초과 수익, 승률, 평균/최고/최저 수익
- **성과 비교 차트**: 전략 vs 단순 보유 자산 곡선
- **거래 내역**: 매수일/매도일, 매수가/매도가, 수익률 표

### Telegram ETF 알림 봇
- **웹 로그인 없이**: 텔레그램 봇에서 `/start` → ETF 선택 → 괴리율 기준 선택으로 구독
- **매수 알림**: 매일 평일 09:30(KST)에 괴리율이 설정값 이하인 ETF에 대해 텔레그램으로 알림 발송
- **저장**: Vercel KV(Upstash)에 구독 정보 저장

### UI·환경
- **다국어**: 한국어 / 영어 전환(헤더 버튼)
- **다크 모드**: 라이트 / 다크 / 시스템(OS 설정 따름), 헤더에서 원형 버튼으로 전환
- **반응형**: 모바일·데스크톱 대응, 헤더 제목·버튼 영역 모바일에서도 양끝 정렬(space-between)
- **알림·기능 요청**: 매일 괴리율 알림은 텔레그램 채널에서 받을 수 있습니다. 프리미엄 기준 개인화 등 추가 기능을 원하시면 하단 배너에서 GitHub 이슈 또는 메일로 요청해 주세요.

## 지원 ETF 목록

| 기초지수 | ETF |
|---------|-----|
| Nasdaq 100 (NDX) | TIGER 미국나스닥100, KODEX 미국나스닥100TR, ACE 미국나스닥100 |
| S&P 500 (SPX) | TIGER 미국S&P500, KODEX 미국S&P500TR, ACE 미국S&P500 |
| Philadelphia Semiconductor (SOX) | TIGER 미국필라델피아반도체나스닥, KODEX 미국반도체MV, ACE 미국반도체커버드콜(합성) |

## 계산 공식

```
iNAV(실시간 추정가) = NAV(전일) × (1 + 기초지수 수익률) × (1 + 환율 변동률)
프리미엄(%) = (ETF 현재가 - iNAV) / iNAV × 100
```

**매매 신호 기준**
- **BUY**: 프리미엄 ≤ -1% (저평가)
- **SELL**: 프리미엄 ≥ +1% (고평가)
- **HOLD**: -1% < 프리미엄 < +1% (적정)

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, CSS 변수 기반 테마(라이트/다크)
- **테마**: next-themes
- **다국어**: next-intl
- **차트**: Recharts
- **데이터**: 네이버 금융 API (국내 ETF·NAV, 해외 지수, 환율)

## 실행 방법

```bash
npm install
npm run dev
```

## Telegram 봇 설정 (선택)

1. [@BotFather](https://t.me/BotFather)에서 봇 생성 후 `TELEGRAM_BOT_TOKEN` 발급
2. 환경 변수 설정 (Vercel 또는 `.env.local`):
   - `TELEGRAM_BOT_TOKEN`: 봇 토큰 (필수)
   - `CRON_SECRET`: **필수**. CRON API 보호용 시크릿. 미설정 시 `/api/telegram/cron`은 503을 반환하며, 설정 시 Vercel Cron이 `Authorization: Bearer <CRON_SECRET>` 헤더로 자동 호출합니다. 이 값을 모르면 외부에서 cron 호출 불가.
   - `NEXT_PUBLIC_TELEGRAM_CHANNEL_URL`: (선택) 텔레그램 채널 초대 링크. 설정 시 알람 배너에 "텔레그램 채널 참여" 버튼이 노출됩니다. 예: `https://t.me/your_channel` 또는 비공개 채널 초대 링크.
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`: (선택) 마이페이지 구독 설정에서 "텔레그램 알림 연결" 시 열리는 봇 링크용. 봇 사용자명만 입력 (예: `MyEtfAlertBot`. `@` 없이).
   - KV는 기존대로 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 사용
3. Vercel 배포 후 웹훅 등록:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/telegram/webhook
   ```
4. CRON은 매일 평일 00:30 UTC(09:30 KST)에 `/api/telegram/cron` 자동 호출

## 라이선스

MIT
