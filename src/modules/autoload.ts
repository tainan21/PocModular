/**
 * Autoloader de manifests — opt-in, Node-only.
 *
 * **Por que isso existe**
 * Em v4 mantivemos `all-manifests.ts` — uma lista canônica, explícita, com um
 * import por módulo. Isso é o certo para o host Next/Turbopack, onde o bundler
 * precisa ver cada import estático para formar o grafo de chunks.
 *
 * Mas a POC agora tem fronteiras externas (smokes, admin-preview em outro repo
 * amanhã, CLI de migração). Nesses contextos puros de Node, é desejável
 * descobrir módulos via filesystem em vez de manter o `all-manifests.ts`
 * sincronizado.
 *
 * **Regra**
 *
 * - Em Next.js (Turbopack / RSC / Route Handlers): use sempre o `all-manifests.ts`.
 *   NÃO importe este arquivo de dentro do bundle, pois `node:fs` não é polyfilled
 *   e tenta resolver caminhos que o bundler não conhece.
 *
 * - Em Node puro (scripts, smokes, admin externo): chame `autoloadManifests()`.
 *
 * **Contrato**
 * Retorna o mesmo shape de `all-manifests.ts` — uma lista de `ModuleManifest`,
 * ordenada pelo nome do diretório, com cada manifest sendo o default export
 * ou o export nomeado `manifest` de `src/modules/<id>/manifest.ts`.
 */

import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { ModuleManifest } from "@host/core/contracts"

/** Assinatura aceita para o export do manifest. */
type ManifestExport =
  | ModuleManifest
  | { default: ModuleManifest }
  | { manifest: ModuleManifest }

function isManifestShape(x: unknown): x is ModuleManifest {
  return (
    !!x &&
    typeof x === "object" &&
    "id" in x &&
    "name" in x &&
    "area" in x &&
    typeof (x as { id: unknown }).id === "string"
  )
}

function extractManifest(mod: unknown, moduleDir: string): ModuleManifest {
  const m = mod as Record<string, unknown> | null
  if (!m || typeof m !== "object") {
    throw new Error(`autoload: módulo em "${moduleDir}" importado vazio`)
  }

  // 1) Convenções explícitas
  if (isManifestShape(m.manifest)) return m.manifest
  if (isManifestShape(m.default)) return m.default

  // 2) Convenção do repo: export const <id>Manifest.
  //    Procuramos qualquer export nomeado terminando em "Manifest" que tenha
  //    o shape correto. Isso cobre `notesManifest`, `catalogManifest`, etc.,
  //    sem precisar renomear o código existente.
  for (const [key, value] of Object.entries(m)) {
    if (key.endsWith("Manifest") && isManifestShape(value)) {
      return value
    }
  }

  // 3) Fallback: o próprio módulo É o manifest (raro, mas ESM namespace).
  if (isManifestShape(m)) return m

  throw new Error(
    `autoload: módulo em "${moduleDir}" não expõe um manifest válido. ` +
      `Aceitos: export default, export \`manifest\`, ou export nomeado terminando em "Manifest".`,
  )
}

/**
 * Descobre manifests em `modulesRoot`/&lt;id&gt;/manifest.ts e retorna uma lista
 * já resolvida. O caller é responsável por passar o path absoluto correto
 * (tipicamente `join(process.cwd(), "src", "modules")`).
 */
export async function autoloadManifests(modulesRoot: string): Promise<ModuleManifest[]> {
  let entries: string[]
  try {
    entries = readdirSync(modulesRoot)
  } catch (err) {
    throw new Error(
      `autoload: falha ao listar "${modulesRoot}". ${(err as Error).message}`,
    )
  }

  const out: Array<{ id: string; manifest: ModuleManifest }> = []

  for (const entry of entries.sort()) {
    const dir = join(modulesRoot, entry)
    if (!statSync(dir).isDirectory()) continue

    // Convenção fixa: cada módulo expõe src/modules/<id>/manifest.ts.
    const manifestPath = join(dir, "manifest.ts")
    try {
      statSync(manifestPath)
    } catch {
      continue // pasta sem manifest — provavelmente um utilitário local do módulo.
    }

    const url = pathToFileURL(manifestPath).href
    const mod = await import(/* @vite-ignore */ url)
    out.push({ id: entry, manifest: extractManifest(mod, dir) })
  }

  // Detecta IDs duplicados logo, com mensagem clara, porque a coalescência
  // silenciosa depois geraria bugs difíceis de rastrear.
  const seen = new Set<string>()
  for (const { manifest } of out) {
    if (seen.has(manifest.id)) {
      throw new Error(
        `autoload: manifest com id duplicado "${manifest.id}". ` +
          `Cada manifest precisa ter id único.`,
      )
    }
    seen.add(manifest.id)
  }

  return out.map((x) => x.manifest)
}

/**
 * Atalho: resolve automaticamente `<cwd>/src/modules`. Útil em scripts que
 * rodam a partir do root do projeto.
 */
export async function autoloadFromCwd(): Promise<ModuleManifest[]> {
  return autoloadManifests(join(process.cwd(), "src", "modules"))
}
