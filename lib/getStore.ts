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
