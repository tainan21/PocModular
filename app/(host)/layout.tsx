import type { ReactNode } from "react"
import { HostTopbar } from "@host/layouts/host-topbar"
import { HostSidebar } from "@host/layouts/host-sidebar"
import { getRegistryView } from "@host/runtime/registry-view"

/**
 * Layout do host (v2).
 * Carrega overrides do banco uma vez por request, aplica no registry
 * e só depois monta a navegação. Assim o sidebar reflete o estado real.
 */
export default async function HostLayout({ children }: { children: ReactNode }) {
  const registry = await getRegistryView()
  const navigation = registry.buildNavigation()
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <HostTopbar />
      <div className="flex flex-1 overflow-hidden">
        <HostSidebar items={navigation} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
