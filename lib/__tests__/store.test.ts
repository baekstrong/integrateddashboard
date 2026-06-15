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

  it("replaceAll overwrites the entire list in one call", async () => {
    const s = new InMemoryStore([{ id: "1", name: "Old" }])
    await s.replaceAll([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ])
    const list = await s.list()
    expect(list).toHaveLength(2)
    expect(list.map((p) => p.name)).toEqual(["A", "B"])
  })
})
