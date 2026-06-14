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
