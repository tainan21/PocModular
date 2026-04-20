/**
 * smoke-autoload — prova que o autoloader Node descobre os mesmos manifests
 * que o `all-manifests.ts` explícito.
 *
 * Conexão arquitetural:
 *
 *   - `all-manifests.ts` é a fonte estática usada pelo bundler Next.
 *   - `src/modules/autoload.ts` é a fonte dinâmica usada por scripts/CLIs.
 *
 * O smoke garante que os dois listam o **mesmo conjunto de IDs**, forçando a
 * equivalência entre os dois caminhos. Se um novo módulo for adicionado e
 * alguém esquecer de incluí-lo em `all-manifests.ts`, este teste falha com uma
 * mensagem honesta.
 */

import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import assert from "node:assert/strict"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

// Preload para destubar `server-only` em Node puro (igual aos outros smokes).
if (!process.env.__SMOKE_TSX__) {
  const preload = join(here, "preload-server-only.cjs")
  const res = spawnSync(
    "pnpm",
    ["tsx", "--require", preload, fileURLToPath(import.meta.url)],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, __SMOKE_TSX__: "1", NODE_ENV: "test" },
    },
  )
  process.exit(res.status ?? 1)
}

const { autoloadFromCwd } = await import("../src/modules/autoload.ts")
const { allManifests } = await import("../src/modules/all-manifests.ts")

const dynamic = await autoloadFromCwd()
const staticIds = new Set(allManifests.map((m) => m.id))
const dynamicIds = new Set(dynamic.map((m) => m.id))

// As duas listas precisam coincidir. Mostro diffs com nitidez se diferir.
const onlyStatic = [...staticIds].filter((id) => !dynamicIds.has(id))
const onlyDynamic = [...dynamicIds].filter((id) => !staticIds.has(id))

assert.equal(
  onlyStatic.length,
  0,
  `all-manifests.ts tem módulos que o autoloader não encontrou: ${onlyStatic.join(", ")}`,
)
assert.equal(
  onlyDynamic.length,
  0,
  `autoloader encontrou módulos ausentes em all-manifests.ts: ${onlyDynamic.join(", ")}. ` +
    `Adicione-os em src/modules/all-manifests.ts ou remova do fs.`,
)

assert.ok(dynamic.length >= 6, `esperava pelo menos 6 módulos, achei ${dynamic.length}`)

// Checagem mínima de shape: todo manifest precisa de id + name + area.
for (const m of dynamic) {
  assert.ok(m.id, "manifest sem id")
  assert.ok(m.name, `manifest ${m.id} sem name`)
  assert.ok(m.area, `manifest ${m.id} sem area`)
}

console.log(
  `[smoke-autoload] OK — ${dynamic.length} manifests equivalentes entre static e dynamic`,
)
