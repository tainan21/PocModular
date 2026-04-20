import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageShell } from "@poc/module-ui"

export default function NotFound() {
  return (
    <PageShell
      title="Rota não encontrada"
      description="O host não conseguiu resolver este caminho no registry de módulos."
    >
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        <p className="mb-4">Possíveis causas:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>O módulo não está registrado em src/host/registry/index.ts</li>
          <li>O path não corresponde a nenhuma rota declarada no manifest</li>
          <li>O módulo está desabilitado (enabledByDefault = false)</li>
        </ul>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Voltar ao dashboard</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
