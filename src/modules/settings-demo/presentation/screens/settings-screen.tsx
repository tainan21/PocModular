import Link from "next/link"
import { PageShell, StatusBadge } from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getModulePreference } from "../../application/queries"
import { saveModulePreferenceAction } from "../../application/actions"
import { getPlatformClient } from "@server/platform/client"
import type { FeatureFlagDTO } from "@poc/platform-contracts"

/**
 * Screen: formulário de preferências por módulo.
 *
 * v2:
 *  - o form é DIRIGIDO PELO MANIFEST do módulo selecionado
 *    (enable/disable, order, e uma linha por feature flag declarada)
 *  - isso prova que o manifest é o centro da integração:
 *    adicionar uma flag no manifest aparece aqui sem refactor
 */
export async function SettingsScreen(props: {
  params: Record<string, string>
  moduleBasePath: string
}) {
  // Screens consomem a Platform API, nunca o registry diretamente.
  // Isso mantém a camada de apresentação plugável (e quebra ciclos ESM
  // durante a fase de "collect page data" do bundler).
  const platform = getPlatformClient()
  const { items: modules } = await platform.listModules({ pageSize: 200 })
  const targetModuleId = props.params.moduleId ?? modules[0]?.id ?? "notes"
  const [pref, manifest] = await Promise.all([
    getModulePreference(targetModuleId),
    platform.getModule(targetModuleId),
  ])

  return (
    <PageShell
      title="Settings Demo"
      description="Configuração persistida por módulo. O formulário é dirigido pelo manifest."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Módulo selecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <Link
                key={m.id}
                href={`${props.moduleBasePath}/for/${m.id}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  m.id === targetModuleId
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {m.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            Preferências — {manifest?.name ?? targetModuleId}
          </CardTitle>
          {manifest && <StatusBadge status={manifest.status} />}
        </CardHeader>
        <CardContent>
          <form
            action={saveModulePreferenceAction}
            className="flex flex-col gap-5"
          >
            <input type="hidden" name="moduleId" value={targetModuleId} />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="enabled">Módulo habilitado</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Desligar oculta o módulo da navegação e bloqueia suas rotas.
                </p>
              </div>
              <Switch
                id="enabled"
                name="enabled"
                defaultChecked={pref.enabled}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order">Ordem na navegação</Label>
              <Input
                id="order"
                name="order"
                type="number"
                min={0}
                defaultValue={pref.order}
                className="max-w-[120px]"
              />
            </div>

            {(manifest?.featureFlags ?? []).length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                <div>
                  <Label className="text-sm">Feature flags</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Declaradas no manifest de <code>{targetModuleId}</code>.
                  </p>
                </div>
                {manifest!.featureFlags.map((flag: FeatureFlagDTO) => {
                  const current =
                    pref.settings[`flag:${flag.key}`] ?? flag.default
                  return (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between gap-4 border-t pt-3 first-of-type:border-t-0 first-of-type:pt-0"
                    >
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`flag:${flag.key}`} className="text-sm">
                          {flag.label}
                        </Label>
                        {flag.description && (
                          <p className="text-xs text-muted-foreground">
                            {flag.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        id={`flag:${flag.key}`}
                        name={`flag:${flag.key}`}
                        defaultChecked={Boolean(current)}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit">Salvar preferências</Button>
              {pref.updatedAt && (
                <span className="text-xs text-muted-foreground">
                  Última atualização:{" "}
                  {new Date(pref.updatedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
