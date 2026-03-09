# 관심 ETF 설정 테이블 설계 (성능·메모리)

## 접근 패턴

- **읽기**: 항상 `user_id`로 해당 유저의 **전체** 설정 조회 (마이페이지, 텔레그램 동기화).
- **쓰기**: 클라이언트가 **전체** 설정을 보냄 → 한 번에 덮어쓰기.

→ “유저별로 전체를 한 번 읽고, 전체를 한 번 쓴다”가 전부이므로, **한 유저당 1 row**가 유리함.

## 구조 비교

| 항목 | ETF당 1 row (정규화) | 한 유저 1 row (JSONB) |
|------|----------------------|------------------------|
| **읽기** | `WHERE user_id = ?` → N행 반환, 앱에서 객체 조립 | `WHERE user_id = ?` → 1행, JSON 파싱 1회. PK 1회 조회로 동일 비용, 전송 row 수·데이터량 감소 |
| **쓰기** | N번 upsert + 제거된 ETF delete (또는 delete all + N insert) | **1번 UPDATE**. 클라이언트가 전체를 보내므로 DB에서 read 불필요 |
| **저장소** | 행 수 = 유저 수 × ETF 수. `user_id` 반복, 인덱스·행 메타데이터 증가 | 행 수 = 유저 수. JSONB 압축 저장, row/인덱스 수 최소 |
| **메모리** | N개 row → N개 레코드 할당 후 하나의 객체로 합침 | 1행 1컬럼 → 한 번 파싱해 한 객체. 할당·루프 적음 |
| **인덱스** | (user_id, etf_id) 유니크. user_id 기준 범위 스캔 | user_id PK만 필요. 인덱스 크기·유지 비용 감소 |

## 선택: 한 유저 1 row (JSONB)

- 항상 **user_id 기준 전체 조회·전체 갱신**만 하므로, **한 유저 1 row + JSONB**가 성능·메모리 모두 유리함.
- 나중에 “이 ETF를 구독한 유저 목록”처럼 **ETF 기준 집계/쿼리**가 필요해지면, 그때 정규화 테이블 또는 마테리얼 뷰를 추가하는 편이 좋음.

## 테이블

- `user_preferences`: `user_id` (PK), `preferences` (JSONB), `updated_at`.
- `preferences` 형식: `{ "etfId": { "buyPremiumThreshold": number, "sellPremiumThreshold": number }, ... }`.
