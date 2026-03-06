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

- **`npm run test:e2e`** — 서버 자동 기동 후 전체 e2e 실행 (권장)
- `npm run test:e2e:local` — 이미 떠 있는 로컬 서버로만 테스트 (`NO_WEB_SERVER=1`)

## CI (GitHub Actions)

- PR/푸시 시 `.github/workflows/e2e.yml`이 자동으로 E2E 테스트를 실행합니다.
- **테스트 통과 시에만 PR 머지 가능**하게 하려면, 저장소 **Settings → Branches → Branch protection rules**에서 해당 브랜치(main/master)에 **Require status checks to pass**를 켜고 **E2E Tests / e2e** 체크를 추가하세요. 자세한 설정 방법은 [.github/BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md)를 참고하세요.

## 참고

- 테스트는 **한국어(ko)** 로 고정되어 있습니다 (`beforeEach`에서 localStorage 설정).
- API를 호출하는 `calculator-data.spec.ts`는 **Chromium에서만** 실행되도록 설정되어 있어, 외부 API 부하와 타임아웃을 줄이고 `npm run test:e2e` 한 번에 안정적으로 통과합니다. 나머지 스펙(home, about, navigation)은 Chromium·Firefox·WebKit 모두에서 실행됩니다.
