import { getStore } from "@/lib/getStore"
import { ensureSeeded } from "@/lib/seed"
import { DashboardClient } from "@/components/DashboardClient"

export const dynamic = "force-dynamic"

export default async function Page() {
  const store = getStore()
  await ensureSeeded(store)
  const projects = await store.list()
  return <DashboardClient initial={projects} />
}
