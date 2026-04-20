#!/usr/bin/env node
/**
 * Smoke test dos domínios puros (sem Prisma, sem Next).
 *
 * Roda com `node scripts/smoke-domains.mjs` — sem dependências adicionais.
 * Usamos tsx via pnpm para permitir imports TS.
 *
 * Objetivo: garantir que a camada de domínio continua consistente.
 */
import { strict as assert } from "node:assert"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

// Re-executa esse arquivo através do tsx registrado (abaixo) — se o flag existir,
// continuamos; senão, relançamos o processo com tsx.
if (!process.env.__SMOKE_TSX__) {
  const res = spawnSync(
    "pnpm",
    ["tsx", fileURLToPath(import.meta.url)],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, __SMOKE_TSX__: "1" },
    },
  )
  process.exit(res.status ?? 1)
}

const {
  initialState,
  advance,
  canAdvance,
  TOTAL_STEPS,
  suggestedModulesForIntent,
} = await import("../domains/onboarding/application/onboarding-rules.ts")

const {
  composeDashboard,
} = await import("../domains/dashboard/application/dashboard-composition.ts")

const catalogMod = await import(
  "../domains/platform-catalog/domain/module-catalog-entry.ts"
)
const defaultCatalogEntry =
  catalogMod.defaultCatalogEntry ?? catalogMod.default?.defaultCatalogEntry

// -------- onboarding --------
{
  const s0 = initialState()
  assert.equal(s0.currentStep, 1)
  assert.equal(s0.completed, false)
  const s1 = advance({ ...s0, payload: { intent: "pessoal" } })
  assert.equal(s1.currentStep, 2, "advance incrementa step")
  assert.deepEqual(canAdvance({ ...s0, currentStep: 1 }), {
    ok: false,
    reason: "Escolha um contexto de uso.",
  })
  assert.equal(
    canAdvance({ ...s0, currentStep: 1, payload: { intent: "pessoal" } }).ok,
    true,
  )
  assert.equal(TOTAL_STEPS, 3)

  const suggested = suggestedModulesForIntent("pessoal", [
    "notes",
    "tasks",
    "catalog",
  ])
  assert.deepEqual(suggested, ["notes", "tasks"])
  console.log("[smoke] onboarding OK")
}

// -------- dashboard composition --------
{
  const composed = composeDashboard(
    [
      { moduleId: "notes", manifestOrder: 1 },
      { moduleId: "tasks", manifestOrder: 2 },
    ],
    [
      {
        moduleId: "notes",
        kind: "dashboard-widget",
        key: "recent",
        widgetKey: "RecentNotes",
        title: "Notas recentes",
        size: "md",
      },
      {
        moduleId: "notes",
        kind: "dashboard-kpi",
        key: "count",
        widgetKey: "NotesCount",
        label: "Notas",
      },
      {
        moduleId: "tasks",
        kind: "dashboard-widget",
        key: "board",
        widgetKey: "Board",
        title: "Minhas tarefas",
        size: "lg",
      },
    ],
    [
      {
        moduleId: "notes",
        contributionKind: "dashboard-widget",
        contributionKey: "recent",
        order: 10,
        visible: true,
      },
      // tasks/board oculto pelo usuário
      {
        moduleId: "tasks",
        contributionKind: "dashboard-widget",
        contributionKey: "board",
        order: 0,
        visible: false,
      },
    ],
  )

  assert.equal(composed.kpis.length, 1, "kpi default visível")
  assert.equal(composed.widgets.length, 1, "widget escondido some")
  assert.equal(composed.widgets[0].moduleId, "notes")
  console.log("[smoke] dashboard composition OK")
}

// -------- platform-catalog --------
{
  const entry = defaultCatalogEntry("notes")
  assert.equal(entry.moduleId, "notes")
  assert.equal(entry.pricingModel, "free")
  assert.equal(entry.globallyEnabled, true)
  console.log("[smoke] platform-catalog OK")
}

// -------- runtime-info (puro) --------
{
  const rtMod = await import("../src/host/runtime/runtime-info.ts")
  const deriveRuntimeInfo =
    rtMod.deriveRuntimeInfo ?? rtMod.default?.deriveRuntimeInfo

  const baseManifest = {
    id: "notes",
    name: "Notes",
    version: "1.0.0",
    description: "",
    status: "experimental",
    area: "main",
    enabledByDefault: true,
    dependencies: [],
    routes: [],
    screens: {},
  }

  // status disabled vence tudo
  const d1 = deriveRuntimeInfo({
    manifest: { ...baseManifest, status: "disabled" },
    userSelected: true,
  })
  assert.equal(d1.effectiveState, "disabled")

  // catálogo globalmente desligado
  const d2 = deriveRuntimeInfo({
    manifest: baseManifest,
    userSelected: true,
    catalog: {
      pricingModel: "free",
      priceCents: null,
      globallyEnabled: false,
      visibleInOnboarding: true,
      visibleInDashboard: true,
      onboardingOrder: 0,
    },
  })
  assert.equal(d2.effectiveState, "disabled")

  // user opt-out (area main, não selecionado)
  const d3 = deriveRuntimeInfo({ manifest: baseManifest, userSelected: false })
  assert.equal(d3.effectiveState, "user-opt-out")

  // dependência bloqueada
  const d4 = deriveRuntimeInfo({
    manifest: { ...baseManifest, id: "child", dependencies: ["notes"] },
    userSelected: true,
    dependencyStates: { notes: "disabled" },
  })
  assert.equal(d4.effectiveState, "blocked-by-dependency")

  // contexto não suportado
  const d5 = deriveRuntimeInfo({
    manifest: { ...baseManifest, supportedContexts: ["desktop"] },
    userSelected: true,
    currentContext: "web",
  })
  assert.equal(d5.effectiveState, "blocked-by-context")

  // caminho feliz
  const d6 = deriveRuntimeInfo({ manifest: baseManifest, userSelected: true })
  assert.equal(d6.effectiveState, "available")

  console.log("[smoke] runtime-info OK")
}

console.log("\n[smoke] tudo OK ✔")
