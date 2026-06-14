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
