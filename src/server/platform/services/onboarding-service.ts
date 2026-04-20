
/**
 * OnboardingService — leitura e mutação do onboarding do usuário.
 *
 * Responsabilidades:
 *  - carregar snapshot (estado + módulos disponíveis, já filtrados por
 *    catálogo/runtime)
 *  - setar intent (passo 1)
 *  - setar seleção (passo 2)
 *  - finalizar + materializar dashboard (passo 3)
 *  - resetar
 *
 * Acoplamento:
 *  - Depende do registry-view (para descobrir o que está "available" hoje).
 *  - Depende do PlatformStateStore (I/O).
 *  - NÃO depende do Next, não faz redirect. Quem redireciona é o route handler
 *    ou a server action do fluxo de produto.
 */

import { getRegistryView } from "@host/runtime/registry-view"
import { getPlatformStore } from "@server/platform/storage"
import type {
  OnboardingIntent,
  OnboardingState,
} from "@domains/onboarding/application/onboarding-rules"
import type {
  OnboardingSnapshotDTO,
  OnboardingStateDTO,
  OnboardingAvailableModuleDTO,
  PricingModelDTO,
} from "@poc/platform-contracts"
import { PlatformError } from "@poc/platform-contracts"

export async function getOnboardingSnapshotDTO(): Promise<OnboardingSnapshotDTO> {
  const store = await getPlatformStore()
  // registry pode carregar em paralelo com userId. state depende de userId.
  const [userId, registry] = await Promise.all([
    store.getDemoUserId(),
    getRegistryView(),
  ])
  const state = await store.loadOnboardingState(userId)

  const available: OnboardingAvailableModuleDTO[] = []
  for (const info of registry.describeAll()) {
    const m = info.manifest
    if (m.area !== "main") continue
    if (!info.catalog.visibleInOnboarding) continue
    if (!info.catalog.globallyEnabled) continue
    available.push({
      moduleId: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      pricingModel: info.catalog.pricingModel as PricingModelDTO,
      priceCents: info.catalog.priceCents ?? null,
      order: info.catalog.onboardingOrder,
    })
  }
  available.sort((a, b) => a.order - b.order)

  return {
    state: toStateDTO(userId, state),
    availableModules: available,
  }
}

export async function setOnboardingIntent(intent: string): Promise<OnboardingStateDTO> {
  if (!intent) throw new PlatformError("invalid_input", "intent é obrigatório")
  const store = await getPlatformStore()
  const userId = await store.getDemoUserId()
  // userId é pré-requisito do loadOnboardingState, então aqui seguimos serial
  // por necessidade. Nos outros pontos onde independente, já paralelizamos.
  const current = await store.loadOnboardingState(userId)
  const next: OnboardingState = {
    ...current,
    currentStep: 2,
    payload: { ...current.payload, intent: intent as OnboardingIntent },
  }
  await store.saveOnboardingState(userId, next)
  return toStateDTO(userId, next)
}

export async function setOnboardingSelection(
  moduleIds: string[],
): Promise<OnboardingStateDTO> {
  if (!Array.isArray(moduleIds)) {
    throw new PlatformError("invalid_input", "moduleIds deve ser array de string")
  }
  const store = await getPlatformStore()
  // userId e registry são independentes -> paralelo.
  const [userId, registry] = await Promise.all([
    store.getDemoUserId(),
    getRegistryView(),
  ])

  const availableIds = registry
    .describeAll()
    .filter((i) => i.manifest.area === "main" && i.catalog.globallyEnabled)
    .map((i) => i.manifest.id)

  const unknown = moduleIds.filter((id) => !availableIds.includes(id))
  if (unknown.length > 0) {
    throw new PlatformError("invalid_input", "ids de módulo inválidos", 400, {
      invalid: unknown,
    })
  }

  await store.bulkSetSelection(userId, moduleIds, availableIds)
  const current = await store.loadOnboardingState(userId)
  const next: OnboardingState = {
    ...current,
    currentStep: 3,
    payload: { ...current.payload, selectedModuleIds: moduleIds },
  }
  await store.saveOnboardingState(userId, next)
  return toStateDTO(userId, next)
}

export async function finishOnboarding(): Promise<OnboardingStateDTO> {
  const store = await getPlatformStore()
  // user + state + registry podem carregar em paralelo — nenhum depende do
  // outro. Antes isso era serial e somava 3 round-trips.
  const [userId, registry] = await Promise.all([store.getDemoUserId(), getRegistryView()])
  const state = await store.loadOnboardingState(userId)
  const selected = state.payload.selectedModuleIds ?? []

  // Materializa TODAS as contribuições primeiro e bateia em paralelo.
  // O loop anterior era O(widgets × módulos) round-trips seriais.
  type Task = {
    moduleId: string
    kind: "dashboard-widget" | "dashboard-kpi"
    key: string
    order: number
  }
  const tasks: Task[] = []
  let order = 0
  for (const moduleId of selected) {
    const m = registry.get(moduleId)
    if (!m) continue
    for (const c of m.contributions ?? []) {
      if (c.kind === "dashboard-widget" || c.kind === "dashboard-kpi") {
        tasks.push({ moduleId, kind: c.kind, key: c.key, order: order++ })
      }
    }
  }

  await Promise.all(
    tasks.map((t) =>
      store.setDashboardItem(userId, t.moduleId, t.kind, t.key, {
        order: t.order,
        visible: true,
      }),
    ),
  )

  const next: OnboardingState = { ...state, completed: true, currentStep: 3 }
  await store.saveOnboardingState(userId, next)
  return toStateDTO(userId, next)
}

export async function resetOnboarding(): Promise<OnboardingStateDTO> {
  const store = await getPlatformStore()
  const userId = await store.getDemoUserId()
  await store.resetOnboardingState(userId)
  return {
    userId,
    completed: false,
    currentStep: 1,
    selectedModuleIds: [],
  }
}

// ---------------------------------------------------------------------------

function toStateDTO(userId: string, state: OnboardingState): OnboardingStateDTO {
  return {
    userId,
    completed: state.completed,
    currentStep: clampStep(state.currentStep),
    intent: state.payload.intent,
    selectedModuleIds: state.payload.selectedModuleIds ?? [],
  }
}

function clampStep(n: number): 1 | 2 | 3 {
  if (n <= 1) return 1
  if (n >= 3) return 3
  return 2
}
