# OAuth 로그인 아키텍처

Next.js(App Router) + TypeScript + Neon PostgreSQL + Drizzle ORM + Auth.js(NextAuth) 기반 OAuth 로그인 설계 및 구현 요약.

---

## 1. 전체 아키텍처

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  OAuth Provider │────▶│  NextAuth (Auth.js)│────▶│  Drizzle Adapter │
│  (Google 등)    │     │  /api/auth/[...]   │     │                 │
└─────────────────┘     └─────────┬─────────┘     └────────┬────────┘
                                  │                         │
                                  │  session (JWT)          │  쿼리/삽입
                                  ▼                         ▼
                         ┌──────────────────┐     ┌─────────────────┐
                         │  클라이언트/페이지 │     │  Neon PostgreSQL │
                         │  (getServerSession)│     │  users           │
                         └──────────────────┘     │  oauth_accounts  │
                                                 │  sessions        │
                                                 └─────────────────┘
```

- **인증 라우트**: `app/api/auth/[...nextauth]/route.ts` → NextAuth 옵션으로 `auth/auth.ts`의 `authOptions` 사용.
- **DB 접근**: `lib/db/index.ts`에서 Neon serverless driver + Drizzle로 `DATABASE_URL` 사용.
- **스키마**: `lib/db/schema.ts`에 `users`, `oauth_accounts`, `sessions` 정의. Auth.js Drizzle 어댑터가 기대하는 컬럼명을 맞추고, 확장 필드(telegram_id, role, created_at 등) 추가.

---

## 2. DB 스키마 코드

스키마 전체는 `lib/db/schema.ts`에 정의되어 있다.

- **users**: 서비스의 실제 사용자 계정. `id`(uuid), `email`(unique), `name`, `image`, `emailVerified`, `telegramId`, `role`(기본 "FREE"), `createdAt`.
- **oauth_accounts**: OAuth 연동 정보. `id`, `userId`(FK → users.id), `type`, `provider`, `providerAccountId`, `access_token`, `refresh_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`, `createdAt`.  
  제약: `UNIQUE(provider, provider_account_id)` (인덱스명 `oauth_accounts_provider_provider_account_id_idx`).
- **sessions**: DB 세션 사용 시. `sessionToken`, `userId`, `expires`.

Foreign key 및 unique 제약은 위 테이블 정의와 `lib/db/schema.ts` 내 인덱스로 적용되어 있다.

---

## 3. Auth.js 설정 코드

- **설정 진입점**: `auth/auth.ts`  
  - `DrizzleAdapter(db, { usersTable: users, accountsTable: oauthAccounts, sessionsTable: sessions })` 로 Neon + 커스텀 테이블 사용.
- **프로바이더/콜백**: `auth/auth.config.ts`  
  - Google 프로바이더, JWT 전략, `jwt`/`session` 콜백에서 `user.id` → `token.id` → `session.user.id` 로 전달.
- **라우트**: `app/api/auth/[...nextauth]/route.ts`  
  - `NextAuth(authOptions)`를 GET/POST로 export.

Session에 `user.id` 포함을 위해 `types/next-auth.d.ts`에서 `Session.user`와 `JWT`를 확장했다.

---

## 4. OAuth 로그인 처리 흐름

Auth.js + Drizzle 어댑터가 아래 흐름을 처리한다.

1. **OAuth provider에서 로그인 성공**  
   - 사용자가 Google(또는 추가한 provider)로 로그인하고, provider가 인증 후 redirect.

2. **provider + provider_account_id 로 oauth_accounts 검색**  
   - 어댑터가 `(provider, providerAccountId)` 로 계정 조회.

3. **존재하면**  
   - 해당 행의 `user_id`에 해당하는 사용자로 로그인 처리(세션 생성 등).

4. **존재하지 않으면**  
   - OAuth에서 받은 `email`로 `users` 테이블 검색.
   - **email이 존재하면**: 해당 user에 대해 `oauth_accounts` 행 생성(기존 user에 OAuth 연결).
   - **email이 없으면**: `users`에 새 행 생성 후, 해당 `user_id`로 `oauth_accounts` 생성.

이렇게 하면 “한 사람 = 한 users 레코드”를 유지하면서 여러 provider를 같은 계정에 연결할 수 있다.

---

## 5. 확장 가능성

- **프로바이더 추가**: `auth/auth.config.ts`의 `providerMap`에 Kakao, Github 등 추가 후, `providers` 배열에 넣으면 된다.  
  - 예: `import Github from "next-auth/providers/github"` 후 `providerMap.github = Github`, `providers`에 포함.
- **DB 필드 추가**: `users`에 컬럼 추가 시 `lib/db/schema.ts`만 수정하고, 필요 시 마이그레이션 생성/적용(`npm run db:generate`, `npm run db:push`).
- **세션 전략**: 현재는 JWT. DB 세션으로 바꾸려면 `session.strategy: "database"` 로 바꾸고, 어댑터에 이미 넘긴 `sessionsTable`이 사용된다.

---

## 6. 추가 설명

### 이 구조가 다중 OAuth를 지원하는 이유

- **한 사용자(users 한 행)에 여러 oauth_accounts**가 연결되는 구조이기 때문이다.  
- `oauth_accounts.user_id`가 `users.id`를 참조하고, 동일 `user_id`에 여러 `(provider, provider_account_id)` 조합이 올 수 있다.  
- 따라서 “Google로 가입 → 나중에 같은 이메일로 Kakao 연동”처럼, 하나의 계정에 여러 provider를 붙일 수 있다.

### users와 oauth_accounts를 분리하는 이유

- **users**: “우리 서비스의 한 사람”에 대한 정보(이메일, 이름, 역할, 텔레그램 등). provider와 무관하게 하나로 유지하고 싶은 데이터.
- **oauth_accounts**: “어떤 provider로, 어떤 provider 쪽 계정으로 로그인했는지”와 토큰 정보. provider별로 여러 개가 있을 수 있다.  
- 분리하면 같은 사용자가 여러 방식으로 로그인할 수 있고, 사용자 정보는 users 한 곳에서만 관리하면 된다.

### 계정 중복 생성이 발생하지 않도록 하는 방법

1. **(provider, provider_account_id) 유일 제약**  
   - `oauth_accounts`에 `UNIQUE(provider, provider_account_id)`가 있으므로, 같은 provider의 같은 계정이 두 번 들어가지 않는다.  
   - 어댑터는 “이미 있으면 해당 user로 로그인, 없으면 이메일로 user 찾거나 생성 후 연결” 로 동작한다.

2. **이메일 기준 user 매칭**  
   - 새 OAuth 로그인 시, 해당 provider 계정이 없으면 “OAuth에서 받은 email”로 기존 user를 찾고, 있으면 그 user에 `oauth_accounts`만 추가한다.  
   - 따라서 “같은 이메일인데 provider만 다른 경우”에도 user가 중복 생성되지 않는다.

### UNIQUE(provider, provider_account_id)가 왜 필요한지

- **provider + provider_account_id**는 “해당 provider 내에서의 사용자 식별자” 쌍이다.  
- 이 쌍이 한 번만 존재해야 “이 Google 계정 = 이 oauth_accounts 행 = 이 user_id”가 항상 일의적으로 정해진다.  
- 유일 제약이 없으면 같은 Google 계정으로 여러 행이 생겨, 어떤 user에 연결할지 모호해지고 중복/불일치가 발생할 수 있다.  
- 따라서 “한 provider 계정당 oauth_accounts 한 행”을 보장하기 위해 `UNIQUE(provider, provider_account_id)`가 필요하다.

---

## 7. 환경 변수 및 명령어

- **환경 변수**: `DATABASE_URL` (Neon PostgreSQL).  
  NextAuth: `AUTH_SECRET` 또는 `NEXTAUTH_SECRET`.  
  Google OAuth: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (또는 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) — 코드에서 두 이름 모두 지원.  
  개발 시 포트가 3000이 아니면(예: 3001) `NEXTAUTH_URL=http://localhost:3001` 로 맞춰 두면 콜백이 정상 동작함.
- **마이그레이션**:  
  - `npm run db:generate` — 스키마 변경 시 마이그레이션 파일 생성.  
  - `npm run db:push` — 스키마를 DB에 반영(개발 시 편의용).  
  - `npm run db:studio` — Drizzle Studio로 DB 확인.

위 설정과 코드 구조를 따르면, 요구사항대로 다중 OAuth 연결·계정 중복 방지·확장 가능한 구조가 유지된다.
