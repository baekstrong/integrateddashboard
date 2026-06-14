import { NextResponse } from "next/server"
import { COOKIE_NAME, makeToken, getPassword, getSecret } from "@/lib/auth"

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }))
  if (!password || password !== getPassword()) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 })
  }
  const token = await makeToken(getPassword(), getSecret())
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  })
  return res
}
