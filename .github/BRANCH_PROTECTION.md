# 브랜치 보호: PR 머지 전 E2E 테스트 필수

PR을 머지하기 전에 **E2E 테스트가 통과해야만 머지 가능**하도록 하려면 아래처럼 브랜치 보호 규칙을 설정하세요.

## 설정 방법

1. GitHub 저장소에서 **Settings** → **Branches** 이동
2. **Branch protection rules**에서 **Add rule** (또는 기존 규칙 편집)
3. **Branch name pattern**에 보호할 브랜치 입력 (예: `main` 또는 `master`)
4. **Require status checks to pass before merging** 체크
5. **Status checks that are required** 검색란에 `e2e` 또는 `Playwright E2E` 입력 후, 나타나는 체크(예: **E2E Tests / e2e**) 선택
6. 필요 시 **Require branches to be up to date before merging** 체크 (최신 base와 동기화 필수)
7. **Create** 또는 **Save changes**로 저장

이후 해당 브랜치로의 PR은 **E2E Tests** 워크플로가 성공해야만 머지 버튼이 활성화됩니다.
