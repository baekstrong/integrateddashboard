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
