/**
 * /admin-preview — prova viva da fronteira v5.
 *
 * Esta página NÃO faz import de `@server/platform/*`. Só fala com a
 * Platform API via HTTP, usando o mesmo `@poc/platform-client` que um
 * admin hospedado em outro repositório usaria. É o que torna a v5
 * "realmente plugável": trocar esta página por um app separado em outro
 * domínio é só apontar `baseUrl` pra outro lugar.
 */
import { headers } from "next/headers"
import Link from "next/link"
import { Boxes, ShieldCheck, Radio, ExternalLink } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createHttpPlatformClient } from "@poc/platform-client"

export const dynamic = "force-dynamic"

async function baseUrlFromHeaders(): Promise<string> {
  // Em dev/prod o host é visível nos headers; em alguns runtimes precisa
  // de fallback explícito. Não usamos env porque o objetivo é demonstrar
  // que esta página poderia rodar em qualquer origem — só muda baseUrl.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export default async function AdminPreviewPage() {
  const baseUrl = await baseUrlFromHeaders()
  // Um admin de verdade guardaria esse token em cookie/JWT. Aqui mostramos
  // que o header `X-Platform-Actor` é o bastante para a API liberar escritas.
  const platform = createHttpPlatformClient({ baseUrl, actor: "admin:preview" })

  const [health, modulesPage, runtimePage, catalogPage] = await Promise.all([
    platform.getHealth(),
    platform.listModules({ pageSize: 200 }),
    platform.listRuntime({ pageSize: 200 }),
    platform.listCatalog({ pageSize: 200 }),
  ])

  const modules = modulesPage.items
  const runtime = runtimePage.items
  const catalog = catalogPage.items
  const runtimeById = new Map(runtime.map((r) => [r.moduleId, r]))
  const catalogById = new Map(catalog.map((c) => [c.moduleId, c]))

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Prova de fronteira
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Preview (via HTTP)
            </h1>
          </div>
        </div>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          Esta página usa{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            createHttpPlatformClient()
          </code>{" "}
          contra <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{baseUrl}</code>.
          Não há import de serviço interno. Mover este arquivo para outro
          repositório Node/Next é apenas mudar{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">baseUrl</code> e autenticar.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Radio className="h-3 w-3" />
            actor: admin:preview
          </Badge>
          <Badge variant="outline">
            Platform API {health.platformVersion}
          </Badge>
          <Badge variant={health.degraded ? "destructive" : "secondary"}>
            store: {health.store}
            {health.degraded ? " (degraded)" : ""}
          </Badge>
          <Button asChild variant="ghost" size="sm" className="ml-auto gap-1">
            <Link href="/debug/platform">
              Debug Platform
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Módulos" value={modules.length} />
        <StatCard
          label="Ativos"
          value={runtime.filter((r) => r.effectiveState === "available").length}
        />
        <StatCard
          label="No catálogo"
          value={catalog.filter((c) => c.globallyEnabled).length}
        />
        <StatCard
          label="Serviços OK"
          value={Object.values(health.services).filter((s) => s === "ok").length}
          total={Object.values(health.services).length}
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4" />
              Módulos registrados
            </CardTitle>
            <CardDescription>
              Renderizado só a partir de DTOs da Platform API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Módulo</th>
                    <th className="px-4 py-2">Área</th>
                    <th className="px-4 py-2">Runtime</th>
                    <th className="px-4 py-2">Catálogo</th>
                    <th className="px-4 py-2 text-right">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {modules.map((m) => {
                    const rt = runtimeById.get(m.id)
                    const cat = catalogById.get(m.id)
                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {m.id} · v{m.version}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {m.area}
                        </td>
                        <td className="px-4 py-3">
                          <RuntimeBadge state={rt?.effectiveState} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {cat
                            ? `${cat.pricingModel}${
                                cat.globallyEnabled ? "" : " · off"
                              }`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs tabular-nums text-muted-foreground">
                          {m.featureFlags.length
                            ? `${m.featureFlags.filter((f) => f.current).length}/${m.featureFlags.length}`
                            : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="text-xs text-muted-foreground">
        Fonte: <code>GET /api/platform/v1/modules</code>,{" "}
        <code>/runtime</code>, <code>/catalog</code>, <code>/health</code>.
      </footer>
    </main>
  )
}

function StatCard({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total?: number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
          {value}
          {typeof total === "number" ? (
            <span className="ml-1 text-base text-muted-foreground">/{total}</span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  )
}

function RuntimeBadge({ state }: { state?: string }) {
  if (!state) return <Badge variant="outline">—</Badge>
  if (state === "available")
    return <Badge className="bg-primary/15 text-primary hover:bg-primary/20">available</Badge>
  if (state === "disabled") return <Badge variant="secondary">disabled</Badge>
  return <Badge variant="outline">{state}</Badge>
}
