# CHANGELOG

## 2026-06-15
- Vercel 배포 완료 및 Upstash Redis(KV) 연결. 환경변수(DASHBOARD_PASSWORD,
  AUTH_SECRET, KV_*) 설정 후 카드 추가/편집/삭제가 KV에 영속됨을 확인. 운영 시작.
- 코드리뷰 반영: logout 쿠키 속성 일치, 로그인 상수시간 비교, ensureSeeded
  이중삽입 방지, API 실패 시 UI 피드백, AUTH_SECRET 미설정 경고, next 버전 고정.

## 2026-06-14
- 통합 대시보드 초기 구현: 비밀번호 로그인, 카드 CRUD(추가/편집/삭제),
  Vercel KV 저장, 초기 5개 프로젝트 시드(케틀벨 원데이·유튜브 편집 대시보드·
  백관장 홈페이지·근력학교 앱·메트로놈).
