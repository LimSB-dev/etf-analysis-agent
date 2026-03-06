# E2E 테스트

Playwright 기반 end-to-end 테스트입니다.

## 파일 구조 (기능별 분리)

| 파일 | 역할 |
|------|------|
| `home.spec.ts` | 홈 페이지 기본 UI (헤더, 계산기 영역, ETF 선택, 푸터 등) |
| `calculator-data.spec.ts` | 시세 조회 후 데이터 반영·화면·로직 검증 (API 데이터, 신호/프리미엄 일치) |
| `about.spec.ts` | About 페이지 |
| `navigation.spec.ts` | 주요 링크 네비게이션 |
| `helpers/test-utils.ts` | 공용 유틸 (프리미엄 파싱, 로케일 초기화) |
| `test-i18n.ts` | e2e용 번역 메시지 (한국어 기준) |

## 실행

- `npm run test:e2e` — 서버 기동 후 전체 e2e 실행
- `npm run test:e2e:local` — 이미 떠 있는 로컬 서버로만 테스트

## 참고

- 테스트는 **한국어(ko)** 로 고정되어 있습니다 (`beforeEach`에서 localStorage 설정).
- `calculator-data.spec.ts`는 실제 API를 호출하므로 네트워크/타임아웃에 따라 실패할 수 있습니다.
