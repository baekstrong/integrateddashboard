# 통합 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비밀번호로 보호되는, 화면에서 프로젝트 카드를 추가/편집/삭제하는 내 프로젝트 링크 허브를 Next.js + Vercel KV로 만들어 Vercel에 배포한다.

**Architecture:** Next.js App Router. 데이터는 `ProjectStore` 인터페이스 뒤로 추상화해 테스트는 인메모리 구현으로, 운영은 Vercel KV(Upstash Redis) 구현으로 돌린다. 인증은 환경변수 비밀번호 → 토큰 쿠키 → 미들웨어 게이트. UI는 서버 컴포넌트가 초기 목록을 그리고 클라이언트 컴포넌트가 CRUD를 처리한다.

**Tech Stack:** Next.js(App Router, TypeScript), Tailwind CSS, @vercel/kv, nanoid, vitest.

---

## File Structure

```
package.json                         프로젝트 의존성/스크립트
next.config.mjs                      Next 설정
tsconfig.json                        TS 설정
postcss.config.mjs, tailwind.config.ts, app/globals.css   스타일
vitest.config.ts                     테스트 설정
.gitignore, .env.example             환경
middleware.ts                        인증 게이트(쿠키 없으면 /login)
lib/types.ts                         Project / ProjectInput 타입
lib/store.ts                         ProjectStore 인터페이스 + InMemoryStore
lib/kvStore.ts                       KvStore (Vercel KV 구현)
lib/getStore.ts                      환경에 따라 store 선택
lib/seed.ts                          초기 5개 시드 데이터 + ensureSeeded()
lib/auth.ts                          비밀번호 검증 + 토큰 생성/검증
lib/__tests__/store.test.ts          InMemoryStore CRUD 테스트
lib/__tests__/auth.test.ts           토큰 생성/검증 테스트
lib/__tests__/seed.test.ts           시드 테스트
app/api/login/route.ts               POST 로그인
app/api/logout/route.ts              POST 로그아웃
app/api/projects/route.ts            GET 목록 / POST 추가
app/api/projects/[id]/route.ts       PATCH 수정 / DELETE 삭제
app/login/page.tsx                   로그인 화면(클라이언트)
app/page.tsx                         대시보드(서버: 초기 목록 fetch)
app/layout.tsx                       루트 레이아웃
components/DashboardClient.tsx       목록 상태 + 모달 제어(클라이언트)
components/ProjectCard.tsx           카드 1개 렌더
components/ProjectForm.tsx           추가/편집 폼(모달)
CLAUDE.md                            작업 규칙(git pull/push, CHANGELOG)
CHANGELOG.md                         업데이트 기록
README.md                            셋업·배포 안내
```

각 파일은 하나의 책임만 진다. `lib/`는 순수 로직(테스트 대상), `app/`은 라우팅/서버, `components/`는 UI.

---

## Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`, `.env.example`, `vitest.config.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "integrated-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@vercel/kv": "^2.0.0",
    "nanoid": "^5.0.7",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.5.3",
    "vitest": "^2.0.3"
  }
}
```

- [ ] **Step 2: 설정 파일들 작성**

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {}
export default nextConfig
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config"
export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
})
```

- [ ] **Step 3: 스타일·레이아웃·임시 페이지 작성**

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-neutral-950 text-neutral-100; }
```

`app/layout.tsx`:
```tsx
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "통합 대시보드" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx` (임시, Task 7에서 교체):
```tsx
export default function Page() {
  return <main className="p-8">통합 대시보드 (스캐폴드)</main>
}
```

- [ ] **Step 4: .gitignore 와 .env.example 작성**

`.gitignore`:
```
node_modules
.next
.env
.env.local
*.tsbuildinfo
next-env.d.ts
```

`.env.example`:
```
# 대시보드 진입 비밀번호 (Vercel 환경변수에도 동일하게 설정)
DASHBOARD_PASSWORD=change-me
# 토큰 서명용 시크릿(아무 긴 랜덤 문자열)
AUTH_SECRET=change-me-too
# Vercel KV 연결 — Vercel 대시보드에서 KV 생성 시 자동 주입됨(로컬은 vercel env pull)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

- [ ] **Step 5: 의존성 설치 후 빌드 확인**

Run:
```bash
npm install
npm run build
```
Expected: 빌드 성공(임시 페이지 컴파일). 경고는 무방, 에러 없어야 함.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Next.js + Tailwind + vitest 스캐폴드"
```

---

## Task 2: 데이터 타입과 store (TDD)

**Files:**
- Create: `lib/types.ts`, `lib/store.ts`
- Test: `lib/__tests__/store.test.ts`

- [ ] **Step 1: 타입 정의**

`lib/types.ts`:
```ts
export interface Project {
  id: string
  name: string
  liveUrl?: string
  adminUrl?: string
  repoUrl?: string
  host?: string
  tags?: string[]
  note?: string
}

// 입력값: id 없이 받는다(서버가 생성)
export type ProjectInput = Omit<Project, "id">
```

- [ ] **Step 2: 실패하는 테스트 작성**

`lib/__tests__/store.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import { InMemoryStore } from "../store"

describe("InMemoryStore", () => {
  it("starts empty", async () => {
    const s = new InMemoryStore()
    expect(await s.list()).toEqual([])
  })

  it("adds a project and assigns an id", async () => {
    const s = new InMemoryStore()
    const p = await s.add({ name: "A" })
    expect(p.id).toBeTruthy()
    expect(p.name).toBe("A")
    expect(await s.list()).toHaveLength(1)
  })

  it("updates an existing project", async () => {
    const s = new InMemoryStore()
    const p = await s.add({ name: "A" })
    const updated = await s.update(p.id, { name: "B", host: "Vercel" })
    expect(updated?.name).toBe("B")
    expect(updated?.host).toBe("Vercel")
  })

  it("returns null when updating a missing id", async () => {
    const s = new InMemoryStore()
    expect(await s.update("nope", { name: "x" })).toBeNull()
  })

  it("removes a project", async () => {
    const s = new InMemoryStore()
    const p = await s.add({ name: "A" })
    expect(await s.remove(p.id)).toBe(true)
    expect(await s.list()).toEqual([])
  })

  it("returns false when removing a missing id", async () => {
    const s = new InMemoryStore()
    expect(await s.remove("nope")).toBe(false)
  })

  it("seeds initial data via constructor", async () => {
    const s = new InMemoryStore([{ id: "1", name: "Seed" }])
    expect(await s.list()).toHaveLength(1)
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `../store` 모듈 없음.

- [ ] **Step 4: store 인터페이스 + 인메모리 구현 작성**

`lib/store.ts`:
```ts
import { nanoid } from "nanoid"
import type { Project, ProjectInput } from "./types"

export interface ProjectStore {
  list(): Promise<Project[]>
  add(input: ProjectInput): Promise<Project>
  update(id: string, patch: Partial<ProjectInput>): Promise<Project | null>
  remove(id: string): Promise<boolean>
}

export class InMemoryStore implements ProjectStore {
  private projects: Project[]

  constructor(seed: Project[] = []) {
    this.projects = [...seed]
  }

  async list(): Promise<Project[]> {
    return [...this.projects]
  }

  async add(input: ProjectInput): Promise<Project> {
    const project: Project = { id: nanoid(), ...input }
    this.projects.push(project)
    return project
  }

  async update(id: string, patch: Partial<ProjectInput>): Promise<Project | null> {
    const i = this.projects.findIndex((p) => p.id === id)
    if (i === -1) return null
    this.projects[i] = { ...this.projects[i], ...patch }
    return this.projects[i]
  }

  async remove(id: string): Promise<boolean> {
    const before = this.projects.length
    this.projects = this.projects.filter((p) => p.id !== id)
    return this.projects.length < before
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Project 타입과 InMemoryStore CRUD(TDD)"
```

---

## Task 3: KV store 구현과 store 선택기

**Files:**
- Create: `lib/kvStore.ts`, `lib/getStore.ts`

KV 구현은 단일 키(`projects`)에 배열 전체를 읽고/쓰는 방식. 외부 KV에 의존하므로 단위 테스트는 하지 않고(인메모리가 동일 인터페이스를 이미 검증), 타입 컴파일과 빌드로 확인한다.

- [ ] **Step 1: KvStore 작성**

`lib/kvStore.ts`:
```ts
import { kv } from "@vercel/kv"
import { nanoid } from "nanoid"
import type { Project, ProjectInput } from "./types"
import type { ProjectStore } from "./store"

const KEY = "projects"

export class KvStore implements ProjectStore {
  private async readAll(): Promise<Project[]> {
    const data = await kv.get<Project[]>(KEY)
    return data ?? []
  }

  private async writeAll(projects: Project[]): Promise<void> {
    await kv.set(KEY, projects)
  }

  async list(): Promise<Project[]> {
    return this.readAll()
  }

  async add(input: ProjectInput): Promise<Project> {
    const projects = await this.readAll()
    const project: Project = { id: nanoid(), ...input }
    projects.push(project)
    await this.writeAll(projects)
    return project
  }

  async update(id: string, patch: Partial<ProjectInput>): Promise<Project | null> {
    const projects = await this.readAll()
    const i = projects.findIndex((p) => p.id === id)
    if (i === -1) return null
    projects[i] = { ...projects[i], ...patch }
    await this.writeAll(projects)
    return projects[i]
  }

  async remove(id: string): Promise<boolean> {
    const projects = await this.readAll()
    const next = projects.filter((p) => p.id !== id)
    if (next.length === projects.length) return false
    await this.writeAll(next)
    return true
  }
}
```

- [ ] **Step 2: store 선택기 작성**

KV 환경변수가 있으면 KvStore, 없으면(로컬 테스트) 시드된 InMemoryStore를 모듈 싱글톤으로 반환한다.

`lib/getStore.ts`:
```ts
import { InMemoryStore } from "./store"
import { KvStore } from "./kvStore"
import type { ProjectStore } from "./store"
import { SEED } from "./seed"

let memo: ProjectStore | null = null

export function getStore(): ProjectStore {
  if (memo) return memo
  if (process.env.KV_REST_API_URL) {
    memo = new KvStore()
  } else {
    // 로컬/KV 미설정 환경: 시드된 인메모리(재시작 시 초기화됨)
    memo = new InMemoryStore(SEED.map((s, i) => ({ id: `seed-${i + 1}`, ...s })))
  }
  return memo
}
```

> 주의: `lib/seed.ts`는 Task 4에서 만든다. 이 파일은 Task 4 완료 후 빌드가 통과한다. 순서대로 진행하면 문제없다.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Vercel KV store 구현과 환경별 store 선택기"
```

---

## Task 4: 시드 데이터 (TDD)

**Files:**
- Create: `lib/seed.ts`
- Test: `lib/__tests__/seed.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/seed.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import { SEED } from "../seed"

describe("SEED", () => {
  it("has the five initial projects", () => {
    expect(SEED).toHaveLength(5)
    expect(SEED.map((p) => p.name)).toContain("케틀벨 원데이 수업")
    expect(SEED.map((p) => p.name)).toContain("메트로놈")
  })

  it("every seed has a name", () => {
    for (const p of SEED) expect(p.name).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `../seed` 없음.

- [ ] **Step 3: 시드 작성**

`lib/seed.ts`:
```ts
import type { ProjectInput } from "./types"

export const SEED: ProjectInput[] = [
  {
    name: "케틀벨 원데이 수업",
    liveUrl: "https://baekstrong.github.io/productdetailpage/",
    adminUrl: "https://baekstrong.github.io/productdetailpage/admin",
    repoUrl: "https://github.com/baekstrong/productdetailpage",
    host: "GitHub Pages",
    tags: ["운영중"],
  },
  {
    name: "유튜브 편집 대시보드",
    liveUrl: "http://127.0.0.1:8765/",
    host: "로컬",
    note: "추후 주소 변경 예정",
  },
  {
    name: "백관장 홈페이지",
    liveUrl: "https://masterbaek.vercel.app/",
    repoUrl: "https://github.com/baekstrong/baekwebpage",
    host: "Vercel",
  },
  {
    name: "근력학교 앱",
    liveUrl: "https://baekstrong.github.io/timetablemanager/",
    repoUrl: "https://github.com/baekstrong/timetablemanager",
    host: "GitHub Pages",
  },
  {
    name: "메트로놈",
    liveUrl: "https://baekstrong.github.io/metronome/",
    repoUrl: "https://github.com/baekstrong/metronome",
    host: "GitHub Pages",
  },
]
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (store 7 + seed 2 = 9 tests).

- [ ] **Step 5: KV 시드 주입 함수 추가**

운영(KV)에서 처음 한 번 시드를 넣기 위한 함수. `lib/seed.ts` 끝에 추가:
```ts
import type { ProjectStore } from "./store"

// KV가 비어 있으면 시드를 한 번 주입한다(idempotent).
export async function ensureSeeded(store: ProjectStore): Promise<void> {
  const existing = await store.list()
  if (existing.length > 0) return
  for (const input of SEED) await store.add(input)
}
```

- [ ] **Step 6: 테스트 재확인 후 Commit**

Run: `npm test`
Expected: PASS (변동 없음, 9 tests).

```bash
git add -A
git commit -m "feat: 초기 5개 시드 데이터와 ensureSeeded(TDD)"
```

---

## Task 5: 인증 로직 (TDD)

**Files:**
- Create: `lib/auth.ts`
- Test: `lib/__tests__/auth.test.ts`

토큰은 `sha256(password + AUTH_SECRET)`의 hex. 쿠키에 이 토큰을 담고, 미들웨어가 예상 토큰과 상수시간 비교한다. 비밀번호 원문은 쿠키/클라이언트에 노출되지 않는다. Web Crypto(`crypto.subtle`)를 써 Edge 미들웨어와 라우트 양쪽에서 동작한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/auth.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import { makeToken, verifyToken } from "../auth"

const PW = "secret-pw"
const SECRET = "sign-secret"

describe("auth token", () => {
  it("makeToken is deterministic for same inputs", async () => {
    const a = await makeToken(PW, SECRET)
    const b = await makeToken(PW, SECRET)
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it("verifyToken accepts a valid token", async () => {
    const t = await makeToken(PW, SECRET)
    expect(await verifyToken(t, PW, SECRET)).toBe(true)
  })

  it("verifyToken rejects a wrong token", async () => {
    expect(await verifyToken("deadbeef", PW, SECRET)).toBe(false)
  })

  it("verifyToken rejects empty token", async () => {
    expect(await verifyToken("", PW, SECRET)).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `../auth` 없음.

- [ ] **Step 3: auth 구현**

`lib/auth.ts`:
```ts
export const COOKIE_NAME = "dash_auth"

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function makeToken(password: string, secret: string): Promise<string> {
  return sha256Hex(`${password}::${secret}`)
}

// 상수시간 비교
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyToken(
  token: string,
  password: string,
  secret: string
): Promise<boolean> {
  if (!token) return false
  const expected = await makeToken(password, secret)
  return safeEqual(token, expected)
}

// 환경변수 헬퍼(라우트/미들웨어에서 사용)
export function getPassword(): string {
  return process.env.DASHBOARD_PASSWORD ?? ""
}
export function getSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret"
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (store 7 + seed 2 + auth 4 = 13 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 비밀번호→토큰 쿠키 인증 로직(TDD)"
```

---

## Task 6: 미들웨어 + 인증 API 라우트

**Files:**
- Create: `middleware.ts`, `app/api/login/route.ts`, `app/api/logout/route.ts`

- [ ] **Step 1: 미들웨어 작성**

쿠키 토큰이 유효하지 않으면 페이지는 `/login`으로, API는 401로 막는다. `/login`과 `/api/login`은 공개.

`middleware.ts`:
```ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { COOKIE_NAME, verifyToken, getPassword, getSecret } from "./lib/auth"

const PUBLIC_PATHS = ["/login", "/api/login"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value ?? ""
  const ok = await verifyToken(token, getPassword(), getSecret())
  if (ok) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  return NextResponse.redirect(url)
}

export const config = {
  // 정적 자산 제외 전부 보호
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 2: 로그인 라우트 작성**

`app/api/login/route.ts`:
```ts
import { NextResponse } from "next/server"
import { COOKIE_NAME, makeToken, getPassword, getSecret } from "@/lib/auth"

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }))
  if (!password || password !== getPassword()) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 })
  }
  const token = await makeToken(getPassword(), getSecret())
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  })
  return res
}
```

- [ ] **Step 3: 로그아웃 라우트 작성**

`app/api/logout/route.ts`:
```ts
import { NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공(미들웨어/라우트 컴파일).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 인증 미들웨어와 login/logout API"
```

---

## Task 7: 프로젝트 CRUD API

**Files:**
- Create: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`

- [ ] **Step 1: 목록/추가 라우트 작성**

`app/api/projects/route.ts`:
```ts
import { NextResponse } from "next/server"
import { getStore } from "@/lib/getStore"
import { ensureSeeded } from "@/lib/seed"
import type { ProjectInput } from "@/lib/types"

export async function GET() {
  const store = getStore()
  await ensureSeeded(store)
  return NextResponse.json(await store.list())
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ProjectInput | null
  if (!body || !body.name?.trim()) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 })
  }
  const created = await getStore().add(body)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 2: 수정/삭제 라우트 작성**

`app/api/projects/[id]/route.ts`:
```ts
import { NextResponse } from "next/server"
import { getStore } from "@/lib/getStore"
import type { ProjectInput } from "@/lib/types"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const patch = (await req.json().catch(() => null)) as Partial<ProjectInput> | null
  if (!patch) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  const updated = await getStore().update(params.id, patch)
  if (!updated) return NextResponse.json({ error: "없는 항목" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ok = await getStore().remove(params.id)
  if (!ok) return NextResponse.json({ error: "없는 항목" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 프로젝트 CRUD API(GET/POST/PATCH/DELETE)"
```

---

## Task 8: 로그인 화면

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: 로그인 페이지 작성**

`app/login/page.tsx`:
```tsx
"use client"
import { useState } from "react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.href = "/"
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "로그인 실패")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <h1 className="text-xl font-semibold text-center">통합 대시보드</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full rounded-md bg-neutral-800 px-3 py-2 outline-none focus:ring-2 ring-neutral-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "확인 중…" : "입장"}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: 로컬 수동 확인**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000` 접속.
Expected: `/login`으로 리다이렉트됨(미들웨어 작동). 임시로 `.env.local`에 `DASHBOARD_PASSWORD=test`, `AUTH_SECRET=abc` 두고 `test` 입력 → `/`로 이동(아직 스캐폴드 페이지). 틀린 비밀번호 → 에러 표시.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: 비밀번호 로그인 화면"
```

---

## Task 9: 대시보드 UI (카드 + CRUD)

**Files:**
- Create: `components/ProjectCard.tsx`, `components/ProjectForm.tsx`, `components/DashboardClient.tsx`
- Modify: `app/page.tsx` (스캐폴드 → 실제 대시보드)

- [ ] **Step 1: ProjectCard 작성**

`components/ProjectCard.tsx`:
```tsx
import type { Project } from "@/lib/types"

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded bg-neutral-800 px-2.5 py-1 text-xs hover:bg-neutral-700"
    >
      {label}
    </a>
  )
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold">{project.name}</h2>
        {project.host && (
          <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
            {project.host}
          </span>
        )}
      </div>
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.map((t) => (
            <span key={t} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-300">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {project.liveUrl && <LinkButton href={project.liveUrl} label="라이브" />}
        {project.adminUrl && <LinkButton href={project.adminUrl} label="관리" />}
        {project.repoUrl && <LinkButton href={project.repoUrl} label="레포" />}
      </div>
      {project.note && <p className="text-xs text-neutral-400">{project.note}</p>}
      <div className="mt-1 flex gap-2 text-xs text-neutral-500">
        <button onClick={() => onEdit(project)} className="hover:text-neutral-200">편집</button>
        <button onClick={() => onDelete(project)} className="hover:text-red-400">삭제</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ProjectForm(모달) 작성**

`components/ProjectForm.tsx`:
```tsx
"use client"
import { useState } from "react"
import type { Project, ProjectInput } from "@/lib/types"

export function ProjectForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Project
  onCancel: () => void
  onSubmit: (input: ProjectInput) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? "")
  const [adminUrl, setAdminUrl] = useState(initial?.adminUrl ?? "")
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "")
  const [host, setHost] = useState(initial?.host ?? "")
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "))
  const [note, setNote] = useState(initial?.note ?? "")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSubmit({
      name: name.trim(),
      liveUrl: liveUrl.trim() || undefined,
      adminUrl: adminUrl.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      host: host.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      note: note.trim() || undefined,
    })
    setSaving(false)
  }

  const field = "w-full rounded-md bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 ring-neutral-500"

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-2 rounded-lg border border-neutral-800 bg-neutral-900 p-5"
      >
        <h2 className="mb-2 font-semibold">{initial ? "카드 편집" : "새 카드"}</h2>
        <input className={field} placeholder="이름 *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <input className={field} placeholder="라이브 URL" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
        <input className={field} placeholder="관리자 URL" value={adminUrl} onChange={(e) => setAdminUrl(e.target.value)} />
        <input className={field} placeholder="레포 URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
        <input className={field} placeholder="호스팅 (예: Vercel)" value={host} onChange={(e) => setHost(e.target.value)} />
        <input className={field} placeholder="태그 (쉼표로 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input className={field} placeholder="메모" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200">취소</button>
          <button type="submit" disabled={saving} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: DashboardClient 작성**

`components/DashboardClient.tsx`:
```tsx
"use client"
import { useState } from "react"
import type { Project, ProjectInput } from "@/lib/types"
import { ProjectCard } from "./ProjectCard"
import { ProjectForm } from "./ProjectForm"

type FormState = { open: false } | { open: true; editing?: Project }

export function DashboardClient({ initial }: { initial: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initial)
  const [form, setForm] = useState<FormState>({ open: false })

  async function create(input: ProjectInput) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.ok) {
      const created: Project = await res.json()
      setProjects((prev) => [...prev, created])
    }
    setForm({ open: false })
  }

  async function update(id: string, input: ProjectInput) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.ok) {
      const updated: Project = await res.json()
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
    setForm({ open: false })
  }

  async function remove(p: Project) {
    if (!confirm(`"${p.name}" 카드를 삭제할까요?`)) return
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" })
    if (res.ok) setProjects((prev) => prev.filter((x) => x.id !== p.id))
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 프로젝트</h1>
        <div className="flex gap-2">
          <button onClick={() => setForm({ open: true })} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900">+ 추가</button>
          <button onClick={logout} className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200">로그아웃</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onEdit={(proj) => setForm({ open: true, editing: proj })} onDelete={remove} />
        ))}
      </div>

      {form.open && (
        <ProjectForm
          initial={form.editing}
          onCancel={() => setForm({ open: false })}
          onSubmit={(input) => (form.editing ? update(form.editing.id, input) : create(input))}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 4: 대시보드 페이지 교체**

`app/page.tsx`:
```tsx
import { getStore } from "@/lib/getStore"
import { ensureSeeded } from "@/lib/seed"
import { DashboardClient } from "@/components/DashboardClient"

export const dynamic = "force-dynamic"

export default async function Page() {
  const store = getStore()
  await ensureSeeded(store)
  const projects = await store.list()
  return <DashboardClient initial={projects} />
}
```

- [ ] **Step 5: 로컬 수동 확인**

Run: `npm run dev` 후 로그인 → 대시보드.
Expected: 시드 5개 카드 표시. `+ 추가`로 새 카드 생성, 편집/삭제 동작, 새로고침해도 (로컬은 인메모리라 재시작 전까지) 유지. 라이브/관리/레포 버튼이 새 탭으로 열림.

- [ ] **Step 6: 테스트·빌드 확인 후 Commit**

Run: `npm test && npm run build`
Expected: 테스트 13 PASS, 빌드 성공.

```bash
git add -A
git commit -m "feat: 대시보드 카드 UI와 추가/편집/삭제"
```

---

## Task 10: 운영 문서 (CLAUDE.md / CHANGELOG / README)

**Files:**
- Create: `CLAUDE.md`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1: CLAUDE.md 작성**

`CLAUDE.md`:
```markdown
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
```

- [ ] **Step 2: CHANGELOG.md 작성**

`CHANGELOG.md`:
```markdown
# CHANGELOG

## 2026-06-14
- 통합 대시보드 초기 구현: 비밀번호 로그인, 카드 CRUD(추가/편집/삭제),
  Vercel KV 저장, 초기 5개 프로젝트 시드(케틀벨 원데이·유튜브 편집 대시보드·
  백관장 홈페이지·근력학교 앱·메트로놈).
```

- [ ] **Step 3: README.md 작성**

`README.md`:
```markdown
# 통합 대시보드

흩어진 내 프로젝트(라이브/관리/레포 URL)를 한 화면에 모은 비밀번호 보호 링크 허브.

## 로컬 실행
```bash
npm install
cp .env.example .env.local   # DASHBOARD_PASSWORD, AUTH_SECRET 채우기
npm run dev
```
KV 환경변수가 없으면 인메모리 시드로 동작한다(재시작 시 초기화).

## 배포 (Vercel)
1. 이 레포를 Vercel에 임포트
2. Storage → KV(Upstash Redis) 생성 후 프로젝트에 연결(`KV_*` 자동 주입)
3. 환경변수 `DASHBOARD_PASSWORD`, `AUTH_SECRET` 설정
4. 배포 → 첫 접속 시 시드 5개 자동 주입

## 테스트
```bash
npm test
```
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: CLAUDE.md(작업 규칙) · CHANGELOG · README 추가"
```

---

## Task 11: Vercel 배포 (수동 단계 + 검증)

이 태스크는 사용자와 함께 진행하는 수동 단계다.

- [ ] **Step 1: GitHub 푸시 확인**

Run: `git push`
Expected: `origin/main` 최신.

- [ ] **Step 2: Vercel 임포트 (사용자)**

Vercel 대시보드에서 `baekstrong/integrateddashboard` 임포트. 프레임워크 자동 감지(Next.js).

- [ ] **Step 3: KV 생성·연결 (사용자)**

Vercel → Storage → KV(Upstash Redis) 생성 → 이 프로젝트에 Connect. `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 자동 주입되는지 확인.

- [ ] **Step 4: 환경변수 설정 (사용자)**

Settings → Environment Variables에 `DASHBOARD_PASSWORD`, `AUTH_SECRET`(긴 랜덤 문자열) 추가. 재배포.

- [ ] **Step 5: 운영 검증**

배포 URL 접속 → 로그인 → 시드 5개 카드 확인 → 카드 추가/편집/삭제 후 **새로고침해도 유지**되는지(KV 영속) 확인 → 로그아웃 후 `/`가 다시 로그인으로 막히는지 확인.

- [ ] **Step 6: CHANGELOG 갱신 후 Commit**

`CHANGELOG.md` 2026-06-14 항목에 "Vercel 배포 및 KV 연결 완료" 한 줄 추가.
```bash
git add -A
git commit -m "docs: Vercel 배포·KV 연결 완료 기록"
git push
```

---

## 완료 기준 (Definition of Done)

- `npm test` 13개 통과, `npm run build` 성공
- 로그인 게이트 동작(미인증 시 `/login`, API 401)
- 화면에서 카드 추가/편집/삭제 → KV에 영속(새로고침·타기기 동일)
- 시드 5개가 첫 배포에 자동 주입
- CLAUDE.md에 git pull/push·CHANGELOG 기록 규칙 명시, CHANGELOG에 기록 존재
