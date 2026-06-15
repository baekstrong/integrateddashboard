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

import { nanoid } from "nanoid"
import type { Project } from "./types"
import type { ProjectStore } from "./store"

// 저장소가 비어 있으면 시드를 "한 번의 쓰기"로 원자적으로 주입하고, 현재 목록을 반환한다.
// - 개별 add 루프 대신 replaceAll을 써서, 동시 요청이 인터리빙돼도 결과가 항상 SEED 전체로 수렴(시드 유실 방지).
// - 모듈 플래그를 두지 않으므로, 저장소가 다시 비면 언제든 재시드되어 복구가 가능하다.
export async function ensureSeeded(store: ProjectStore): Promise<Project[]> {
  const existing = await store.list()
  if (existing.length > 0) return existing
  const seeded: Project[] = SEED.map((input) => ({ id: nanoid(), ...input }))
  await store.replaceAll(seeded)
  return seeded
}
