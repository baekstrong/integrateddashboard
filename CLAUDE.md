# CLAUDE.md

## ⚠️ Git 작업 규칙 (필수)

### 0. 브랜치 — 항상 `main`에서 작업
feature 브랜치를 만들지 않고 `main`에 직접 커밋·푸시한다.

### 1. 작업 시작 시 — 가장 먼저 `git pull`
원격 최신 변경을 받아온 뒤 작업을 시작한다. 충돌은 먼저 해결한다.

### 2. 작업 종료 시 — `add` → `commit` → `push`
```bash
git add -A
git commit -m "<한글 커밋 메시지>"
git push
```

### 3. 매 작업 종료 시 — CHANGELOG 기록 (필수)
작업을 끝내기 전 `CHANGELOG.md` 맨 위에 이번에 무엇이 바뀌었는지
한 항목(날짜 + 변경 요약)을 추가한다. **이 기록을 빼먹고 작업을 끝내지 않는다.**

## 프로젝트 개요
여러 웹앱·호스팅으로 흩어진 내 프로젝트 진입점을 한 화면에 모은
비밀번호 보호 링크 허브. Next.js(App Router) + Vercel KV + Vercel 배포.

## 기술 스택
- Next.js(App Router, TypeScript), Tailwind CSS
- Vercel KV(Upstash Redis) — 프로젝트 카드 저장
- vitest — lib 단위 테스트

## 자주 쓰는 명령어
```bash
npm install
npm run dev      # 로컬 개발(KV 미설정 시 인메모리 시드로 동작)
npm test         # lib 단위 테스트
npm run build    # 프로덕션 빌드
```

## 아키텍처
- `lib/` 순수 로직: `store.ts`(인터페이스+InMemoryStore), `kvStore.ts`(KV),
  `getStore.ts`(환경별 선택), `seed.ts`(시드), `auth.ts`(토큰), `types.ts`
- `app/api/` 라우트: login/logout, projects(GET/POST), projects/[id](PATCH/DELETE)
- `middleware.ts` 인증 게이트
- `components/` UI: DashboardClient, ProjectCard, ProjectForm

## 환경변수
`DASHBOARD_PASSWORD`(진입 비밀번호), `AUTH_SECRET`(토큰 서명),
`KV_REST_API_URL`·`KV_REST_API_TOKEN`(Vercel KV, 생성 시 자동 주입).

## 주의
- 비밀번호/시크릿은 코드에 적지 않는다. Vercel 환경변수로만 관리.
- lib 로직 변경 시 테스트 먼저(TDD). 카드 추가는 화면에서.
