export const COOKIE_NAME = "dash_auth"

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function makeToken(password: string, secret: string): Promise<string> {
  return sha256Hex(`${password}::${secret}`)
}

// 상수시간 비교
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyToken(
  token: string,
  password: string,
  secret: string
): Promise<boolean> {
  if (!token) return false
  const expected = await makeToken(password, secret)
  return safeEqual(token, expected)
}

// 환경변수 헬퍼(라우트/미들웨어에서 사용)
export function getPassword(): string {
  return process.env.DASHBOARD_PASSWORD ?? ""
}
export function getSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret"
}
