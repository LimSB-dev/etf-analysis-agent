# ETF 적정가 계산기 (ETF Fair Value Calculator)

한국 상장 미국 ETF(TIGER, KODEX, ACE 등)의 적정가를 실시간으로 계산하고 매수/매도 신호를 제공하는 웹 애플리케이션입니다.

## 주요 기능

- **다양한 ETF 지원**: Nasdaq 100, S&P 500, 필라델피아 반도체 지수를 추종하는 국내 상장 ETF 분석
- **실시간 데이터 조회**: 네이버 금융 API를 통한 ETF 가격, 기초지수(QQQ, SPY, SOXX), 환율 자동 조회
- **적정가 계산**: 기초지수 수익률과 환율 변동을 반영한 ETF 적정가 산출
- **매매 신호**: 프리미엄/디스카운트 기반 BUY/SELL/HOLD 신호 제공
- **다국어 지원**: 한국어/영어 전환 가능

## 지원 ETF 목록

| 기초지수 | ETF |
|---------|-----|
| Nasdaq 100 (QQQ) | TIGER 미국나스닥100, KODEX 미국나스닥100TR, ACE 미국나스닥100 |
| S&P 500 (SPY) | TIGER 미국S&P500, KODEX 미국S&P500TR, ACE 미국S&P500 |
| Philadelphia Semiconductor (SOXX) | TIGER 미국필라델피아반도체나스닥, KODEX 미국반도체MV |

## 계산 공식

```
적정가 = ETF 전일종가 × (1 + 기초지수 수익률) × (1 + 환율 변동률)
프리미엄 = (현재가 - 적정가) / 적정가 × 100
```

**매매 신호 기준**:
- BUY: 프리미엄 ≤ -1% (저평가)
- SELL: 프리미엄 ≥ +1% (고평가)
- HOLD: -1% < 프리미엄 < +1% (적정)

## 기술 스택

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Source**: 네이버 금융 API

## 실행 방법

```bash
npm install
npm run dev
```

## 라이선스

MIT
