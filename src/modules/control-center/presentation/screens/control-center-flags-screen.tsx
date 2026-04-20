import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import {
  PageShell,
  AdminSection,
  AdminRow,
  AdminEmptyState,
  StatusBadge,
} from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import type { ScreenComponent } from "@host/core/contracts"
import { listModuleFlags } from "../../application/queries"
import { setModuleFlagAction } from "../../application/actions"
import { PlatformError } from "@poc/platform-contracts"

export const ControlCenterFlagsScreen: ScreenComponent = async ({ params }) => {
  const moduleId = params.moduleId
  try {
    const { detail } = await listModuleFlags(moduleId)
    const flags = detail.featureFlags

    return (
      <PageShell
        title={`Flags — ${detail.name}`}
        description="Ajuste flags declaradas no manifest deste módulo. Persistido via Platform API."
      >
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar ao Control Center
          </Link>
        </div>

        <AdminSection
          title="Feature flags"
          description="Cada toggle chama POST /api/platform/admin/flag. É o mesmo endpoint que um admin externo consumiria."
        >
          {flags.length === 0 ? (
            <AdminEmptyState
              title="Sem flags declaradas"
              description="Este módulo não declara featureFlags no manifest."
            />
          ) : (
            flags.map((def) => (
              <AdminRow
                key={def.key}
                title={def.label}
                description={def.description ?? `chave: ${def.key}`}
                meta={
                  <StatusBadge tone={def.current ? "success" : "muted"}>
                    {def.current ? "on" : "off"}
                  </StatusBadge>
                }
                actions={
                  <form action={setModuleFlagAction}>
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="flagKey" value={def.key} />
                    <input
                      type="hidden"
                      name="nextValue"
                      value={def.current ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      variant={def.current ? "default" : "outline"}
                      size="sm"
                    >
                      {def.current ? "Desligar" : "Ligar"}
                    </Button>
                  </form>
                }
              />
            ))
          )}
        </AdminSection>
      </PageShell>
    )
  } catch (err) {
    if (err instanceof PlatformError && err.code === "not_found") notFound()
    throw err
  }
}
