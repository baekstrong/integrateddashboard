import { describe, it, expect } from "vitest"
import { SEED, ensureSeeded } from "../seed"
import { InMemoryStore } from "../store"

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

describe("ensureSeeded", () => {
  it("seeds all 5 projects into an empty store and returns them", async () => {
    const s = new InMemoryStore()
    const result = await ensureSeeded(s)
    expect(result).toHaveLength(5)
    expect(await s.list()).toHaveLength(5)
    for (const p of result) expect(p.id).toBeTruthy()
  })

  it("does not re-seed when the store already has data", async () => {
    const s = new InMemoryStore([{ id: "1", name: "기존" }])
    const result = await ensureSeeded(s)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("기존")
  })

  it("re-seeds after the store is emptied (recovery)", async () => {
    const s = new InMemoryStore()
    await ensureSeeded(s)
    await s.replaceAll([])
    const result = await ensureSeeded(s)
    expect(result).toHaveLength(5)
  })

  it("concurrent calls on an empty store both yield 5 (atomic replace)", async () => {
    const s = new InMemoryStore()
    await Promise.all([ensureSeeded(s), ensureSeeded(s)])
    expect(await s.list()).toHaveLength(5)
  })
})
