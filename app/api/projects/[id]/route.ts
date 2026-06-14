import { NextResponse } from "next/server"
import { getStore } from "@/lib/getStore"
import type { ProjectInput } from "@/lib/types"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const patch = (await req.json().catch(() => null)) as Partial<ProjectInput> | null
  if (!patch) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 })
  const updated = await getStore().update(params.id, patch)
  if (!updated) return NextResponse.json({ error: "없는 항목" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ok = await getStore().remove(params.id)
  if (!ok) return NextResponse.json({ error: "없는 항목" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
