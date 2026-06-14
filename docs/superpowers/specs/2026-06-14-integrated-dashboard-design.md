# 통합 대시보드 설계 (Integrated Dashboard)

작성일: 2026-06-14
상태: 승인됨 (구현 계획 대기)

## 1. 목적

여러 웹앱·호스팅으로 흩어진 내 프로젝트들의 **진입점(라이브/관리/레포 URL)을 한 화면에 모은 비밀번호 보호 링크 허브**.

해결하려는 핵심 통증: 프로젝트가 늘어나면서 "어디 있는지(라이브 주소·관리자 페이지·레포·호스팅 위치)를 매번 못 찾는" 문제. 진입점을 한 곳에 모아 북마크 하나로 들어간다.

명시적으로 **하지 않는 것**: 사이트 생존 여부 자동 health check, 도메인 만료 추적, 다중 사용자 로그인. (YAGNI — 나중에 필요해지면 확장)

## 2. 기술 스택

- **Next.js (App Router)** + **Tailwind CSS**
- **Vercel KV (Upstash Redis)** — 프로젝트 카드 목록 영속 저장
- **Vercel** 배포
- 폴더: `/Users/baek/Desktop/앱 제작/18. 통합 대시보드`
- 레포: `https://github.com/baekstrong/integrateddashboard`

> 순수 정적 페이지로 만들지 않는 이유: 관리자/대시보드 URL 같은 민감 링크가 HTML 소스에 그대로 노출되면 비밀번호 보호가 무의미해진다. 인증을 서버에서 처리하고 인증 통과 후에만 민감 URL을 렌더한다.

## 3. 데이터 모델

Vercel KV에 프로젝트 객체 배열을 JSON으로 저장한다. 각 카드:

```jsonc
{
  "id": "nanoid",            // 편집/삭제용 고유 id (서버에서 자동 생성)
  "name": "근력학교 웹앱",    // 카드 제목 (필수)
  "liveUrl": "https://...",  // 공개 라이브 주소 (선택)
  "adminUrl": "https://...", // 관리자/대시보드 — 로그인 후에만 노출 (선택)
  "repoUrl": "https://github.com/...", // 깃 레포 (선택)
  "host": "Vercel",          // 호스팅 위치 라벨 (선택)
  "tags": ["운영중"],         // 자유 라벨 (선택)
  "note": "한 줄 메모"        // 선택
}
```

- 필수는 `name` 하나. 나머지는 선택이며 비어 있으면 카드에서 해당 버튼/요소를 숨긴다.
- KV 키 예: `projects` (객체 배열 하나). 동시 편집은 고려하지 않음(혼자 사용).

### 초기 시드

첫 배포 시 아래 5개를 seed로 한 번 넣는다. 이후엔 화면에서 관리한다.

| 이름 | liveUrl | adminUrl | repoUrl | host |
|------|---------|----------|---------|------|
| 케틀벨 원데이 수업 | `https://baekstrong.github.io/productdetailpage/` | `https://baekstrong.github.io/productdetailpage/admin` | `https://github.com/baekstrong/productdetailpage` | GitHub Pages |
| 유튜브 편집 대시보드 | `http://127.0.0.1:8765/` | — | — | 로컬 |
| 백관장 홈페이지 | `https://masterbaek.vercel.app/` | — | `https://github.com/baekstrong/baekwebpage` | Vercel |
| 근력학교 앱 | `https://baekstrong.github.io/timetablemanager/` | — | `https://github.com/baekstrong/timetablemanager` | GitHub Pages |
| 메트로놈 | `https://baekstrong.github.io/metronome/` | — | `https://github.com/baekstrong/metronome` | GitHub Pages |

- 케틀벨 원데이 수업은 라이브(수강생)·관리자 페이지를 한 카드로 묶는다.
- 유튜브 편집 대시보드의 liveUrl은 임시 로컬 주소이며 추후 변경 예정. `note`에 "추후 주소 변경 예정"을 표기한다.

## 4. 인증

- 진입 시 비밀번호 입력 화면 → 일치하면 **HttpOnly 쿠키** 발급 → 대시보드 표시.
- 비밀번호는 환경변수 `DASHBOARD_PASSWORD`에 보관(소스에 두지 않음).
- **미들웨어**가 쿠키 없는 요청을 로그인 화면으로 보내고, 모든 `/api/projects*` 요청도 보호한다.
- KV 연결은 Vercel이 주입하는 `KV_*`(또는 Upstash `REDIS_*`) 환경변수 사용.

## 5. 기능 (화면 CRUD)

- **목록 보기**: 카드 그리드. 카드마다 이름 + 호스팅 라벨 + 버튼(라이브/관리/레포) + 태그/메모. 버튼은 새 탭으로 열림.
- **추가**: `+ 추가` 버튼 → 폼(이름·각 URL·호스팅·태그·메모) → 저장 → KV 반영.
- **편집**: 카드의 편집 → 같은 폼에 기존 값 채워 수정.
- **삭제**: 카드의 삭제 → 확인 후 KV에서 제거.
- 변경은 즉시 KV에 반영되어 어느 기기에서 접속해도 동일.

## 6. API (전부 인증 보호)

| 메서드 | 경로 | 동작 |
|--------|------|------|
| POST | `/api/login` | 비밀번호 확인 → 쿠키 발급 |
| POST | `/api/logout` | 쿠키 제거 |
| GET | `/api/projects` | 목록 조회 |
| POST | `/api/projects` | 카드 추가 (id 생성) |
| PATCH | `/api/projects/:id` | 카드 수정 |
| DELETE | `/api/projects/:id` | 카드 삭제 |

## 7. UI 레이아웃 (개념)

```
┌─────────────────────────────────────────────┐
│  내 프로젝트                  [+ 추가][로그아웃]│
├──────────────┬──────────────┬──────────────┤
│ 근력학교 웹앱 │ 원데이 예약   │ 내 홈페이지   │
│ Vercel  운영중│              │ Vercel       │
│ [라이브][관리]│ [라이브][관리]│ [라이브][관리]│
│ [레포] [편집]│ [레포] [편집]│ [레포] [편집]│
│  한 줄 메모   │  한 줄 메모   │  한 줄 메모   │
├──────────────┴──────────────┴──────────────┤
│ 유튜브 편집 대시보드 ...                      │
└─────────────────────────────────────────────┘
```

## 8. 운영 규칙 (레포 CLAUDE.md에 명시)

- **작업 시작 시:** 항상 `git pull` 먼저.
- **작업 종료 시:** `git add -A && git commit -m "<한글 메시지>" && git push`.
- **매 작업 종료 시:** `CHANGELOG.md`에 **이번에 무엇이 업데이트됐는지** 한 항목 추가(날짜 + 변경 요약). 이 기록을 빼먹고 작업을 끝내지 않는다.
- 브랜치: 항상 `main`에 직접 커밋·푸시.

## 9. 향후 확장 (이번 범위 밖)

- 사이트 health check(살아있는지) · 최근 배포 시각 · 도메인 만료일 자동 표시
- 카드 그룹/분류, 검색
- 통합 대시보드 자신도 카드로 등록
