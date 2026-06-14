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

import type { ProjectStore } from "./store"

// KV가 비어 있으면 시드를 한 번 주입한다(idempotent).
export async function ensureSeeded(store: ProjectStore): Promise<void> {
  const existing = await store.list()
  if (existing.length > 0) return
  for (const input of SEED) await store.add(input)
}
