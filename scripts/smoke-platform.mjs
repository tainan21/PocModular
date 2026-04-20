#!/usr/bin/env node
/**
 * Smoke da Platform API (v5) — roda os services reais em processo, com store
 * em memória. Prova que:
 *  - o contrato público devolve o que um outro app esperaria via HTTP;
 *  - paginação e filtros funcionam nos listers;
 *  - o actor/RBAC-lite bloqueia `admin:*` quando o actor é public;
 *  - Zod bloqueia payloads inválidos no body das ações.
 *
 * Executar: `node scripts/smoke-platform.mjs`
 */
import { strict as assert } from "node:assert"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

if (!process.env.__SMOKE_TSX__) {
  const preload = join(here, "preload-server-only.cjs")
  const res = spawnSync(
    "pnpm",
    ["tsx", "--require", preload, fileURLToPath(import.meta.url)],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        __SMOKE_TSX__: "1",
        PLATFORM_STORE: "memory",
        NODE_ENV: "test",
      },
    },
  )
  process.exit(res.status ?? 1)
}

const { createLocalPlatformClient } = await import(
  "../src/server/platform/local-client.ts"
)
const { requirePolicy, parseActor } = await import(
  "../src/server/platform/actor.ts"
)
const schemas = await import("../packages/platform-contracts/src/schemas.ts")

/** Matcher resiliente: o actor.ts e o smoke importam PlatformError por caminhos
 *  diferentes, logo `instanceof` pode variar; checamos por shape. */
function isPlatformError(err, code) {
  return !!err && typeof err === "object" && err.code === code && err.name === "PlatformError"
}

const platform = createLocalPlatformClient()

// ---------- health ----------
{
  const h = await platform.getHealth()
  assert.equal(h.ok, true)
  assert.equal(h.store, "memory")
  assert.equal(typeof h.platformVersion, "string")
  assert.equal(typeof h.degraded, "boolean")
  assert.ok(h.registry.moduleCount > 0)
  console.log("[smoke-platform] health OK", {
    store: h.store,
    version: h.platformVersion,
    modules: h.registry.moduleCount,
  })
}

// ---------- modules: paginação + filtro ----------
let anyModuleId
{
  // página default — deve vir com Page<T>
  const p1 = await platform.listModules()
  assert.ok(Array.isArray(p1.items), "listModules deve retornar Page<T>")
  assert.ok(p1.items.length > 0, "deve listar módulos")
  assert.equal(typeof p1.meta.total, "number")
  assert.equal(typeof p1.meta.pageCount, "number")

  // página pequena — deve paginar
  const small = await platform.listModules({ pageSize: 1 })
  assert.equal(small.items.length, 1, "pageSize=1 deve trazer 1")
  assert.equal(small.meta.pageSize, 1)
  assert.ok(small.meta.hasNext, "com pageSize=1 deve ter next")

  // filtro por area
  const sys = await platform.listModules({ area: "system" })
  for (const m of sys.items) assert.equal(m.area, "system")

  // busca q=
  const ctrl = await platform.listModules({ q: "control" })
  assert.ok(ctrl.items.some((m) => m.id.toLowerCase().includes("control")))

  anyModuleId = p1.items[0].id
  console.log("[smoke-platform] modules paginated OK", {
    total: p1.meta.total,
    page1: p1.items.length,
    systemOnly: sys.items.length,
  })
}

// ---------- runtime: filtro por effectiveState ----------
{
  const all = await platform.listRuntime({ pageSize: 200 })
  const avail = await platform.listRuntime({
    effectiveState: "available",
    pageSize: 200,
  })
  for (const r of avail.items) assert.equal(r.effectiveState, "available")
  assert.ok(avail.items.length <= all.items.length)
  console.log("[smoke-platform] runtime filter OK", {
    all: all.items.length,
    available: avail.items.length,
  })
}

// ---------- catalog + features + routes ----------
{
  const cat = await platform.listCatalog()
  assert.ok(Array.isArray(cat.items))

  const features = await platform.listFeatures({ pageSize: 200 })
  assert.ok(Array.isArray(features.items))

  const routes = await platform.listRoutes()
  for (const r of routes) {
    assert.ok(r.href.startsWith("/"))
    assert.ok(r.moduleId)
  }
  console.log("[smoke-platform] catalog + features + routes OK")
}

// ---------- onboarding end-to-end ----------
{
  await platform.resetOnboarding()
  const before = await platform.getOnboarding()
  assert.equal(before.state.completed, false)

  await platform.setOnboardingIntent("pessoal")
  const afterIntent = await platform.getOnboarding()
  assert.equal(afterIntent.state.intent, "pessoal")

  const pick = afterIntent.availableModules.slice(0, 1).map((c) => c.moduleId)
  assert.ok(pick.length > 0)
  await platform.setOnboardingSelection(pick)
  const afterSelect = await platform.getOnboarding()
  assert.deepEqual(afterSelect.state.selectedModuleIds.sort(), [...pick].sort())

  await platform.finishOnboarding()
  const finished = await platform.getOnboarding()
  assert.equal(finished.state.completed, true)
  console.log("[smoke-platform] onboarding OK", { picked: pick })
}

// ---------- dashboard ----------
{
  const dash = await platform.getDashboard()
  assert.ok(Array.isArray(dash.widgets))
  assert.ok(Array.isArray(dash.kpis))
  assert.ok(dash.generatedAt)
  console.log("[smoke-platform] dashboard OK", {
    widgets: dash.widgets.length,
    kpis: dash.kpis.length,
  })
}

// ---------- admin: saveCatalog + setFlag ----------
{
  const { items: modules } = await platform.listModules({ pageSize: 200 })
  const withFlag = modules.find((m) => m.featureFlags.length > 0)
  if (withFlag) {
    const flagKey = withFlag.featureFlags[0].key
    const oldCurrent = withFlag.featureFlags[0].current
    const next = !oldCurrent
    await platform.setFlag({ moduleId: withFlag.id, flagKey, value: next })
    const refreshed = await platform.getModule(withFlag.id)
    const f = refreshed.featureFlags.find((x) => x.key === flagKey)
    assert.equal(f.current, next)
    console.log("[smoke-platform] admin setFlag OK", {
      module: withFlag.id,
      flag: flagKey,
      from: oldCurrent,
      to: next,
    })
  }

  await platform.saveCatalog({
    moduleId: anyModuleId,
    pricingModel: "experimental",
    priceCents: null,
    globallyEnabled: true,
    visibleInOnboarding: true,
    visibleInDashboard: true,
    featureFlagged: false,
    displayOrder: 0,
  })
  const catalog = await platform.listCatalog({ pageSize: 200 })
  const entry = catalog.items.find((e) => e.moduleId === anyModuleId)
  assert.ok(entry)
  assert.equal(entry.pricingModel, "experimental")
  console.log("[smoke-platform] admin saveCatalog OK")
}

// ---------- RBAC-lite: policy ----------
{
  const guestActor = parseActor(null)
  const userActor = parseActor("user:bob")
  const adminActor = parseActor("admin:alice")

  assert.equal(guestActor.role, "guest")
  assert.equal(userActor.role, "user")
  assert.equal(adminActor.role, "admin")

  // guest → admin policy deve dar 401 unauthorized
  let thrown = null
  try {
    requirePolicy(guestActor, "admin")
  } catch (err) {
    thrown = err
  }
  assert.ok(
    isPlatformError(thrown, "unauthorized"),
    "guest em rota admin deve receber 401",
  )

  // user autenticado mas sem role → admin deve dar 403 forbidden
  thrown = null
  try {
    requirePolicy(userActor, "admin")
  } catch (err) {
    thrown = err
  }
  assert.ok(
    isPlatformError(thrown, "forbidden"),
    "user em rota admin deve receber 403",
  )

  // admin passa em admin
  requirePolicy(adminActor, "admin")

  // todos passam em public
  requirePolicy(guestActor, "public")
  requirePolicy(userActor, "public")
  requirePolicy(adminActor, "public")

  // header malformado cai para guest (não lança)
  const bogus = parseActor("not-a-valid-actor")
  assert.equal(bogus.role, "guest", "role desconhecida vira guest")
  console.log("[smoke-platform] RBAC OK")
}

// ---------- Zod: schemas bloqueiam payloads malformados ----------
{
  const { adminSaveCatalogRequestSchema, adminSetFlagRequestSchema } = schemas
  let zErr = null
  try {
    adminSaveCatalogRequestSchema.parse({ moduleId: "" })
  } catch (err) {
    zErr = err
  }
  assert.ok(zErr, "saveCatalog deve falhar com moduleId vazio")

  zErr = null
  try {
    adminSetFlagRequestSchema.parse({
      moduleId: "x",
      flagKey: "y",
      value: "not-bool",
    })
  } catch (err) {
    zErr = err
  }
  assert.ok(zErr, "setFlag deve falhar com value não-booleano")

  // payload válido não deve lançar
  adminSetFlagRequestSchema.parse({
    moduleId: "x",
    flagKey: "y",
    value: true,
  })
  console.log("[smoke-platform] zod schemas OK")
}

// ---------- reset final ----------
{
  await platform.resetOnboarding()
  const after = await platform.getOnboarding()
  assert.equal(after.state.completed, false)
  assert.equal(after.state.selectedModuleIds.length, 0)
  console.log("[smoke-platform] resetOnboarding OK")
}

console.log("\n[smoke-platform] tudo OK")
