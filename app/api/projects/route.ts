import { NextResponse } from "next/server"
import { getStore } from "@/lib/getStore"
import { ensureSeeded } from "@/lib/seed"
import type { ProjectInput } from "@/lib/types"

export async function GET() {
  const store = getStore()
  return NextResponse.json(await ensureSeeded(store))
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ProjectInput | null
  if (!body || !body.name?.trim()) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 })
  }
  const created = await getStore().add(body)
  return NextResponse.json(created, { status: 201 })
}
