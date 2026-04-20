/**
 * MemoryPlatformStore — impl in-memory da porta PlatformStateStore.
 *
 * Utilidade:
 *  - testes de serializers/services sem precisar de banco
 *  - modo de demo offline (ex.: PLATFORM_STORE=memory no ambiente local)
 *
 * Limites honestos:
 *  - o estado é global do processo Node; em serverless resetaria a cada invocação.
 *  - por isso, em produção, use sempre Prisma. Esta impl existe apenas para
 *    provar a separação (a API não sabe qual impl está atrás).
 */

import type { PlatformStateStore } from "./store"
import type {
  ModuleCatalogEntryProps,
  FeatureCatalogEntryProps,
  UserSelection,
} from "@domains/platform-catalog"
import type { ModuleOverrideMap } from "@host/runtime/runtime-info"
import {
  type OnboardingState,
  initialState,
} from "@domains/onboarding/application/onboarding-rules"
import type { UserDashboardItemInput } from "@domains/dashboard/application/dashboard-composition"

type Flags = Record<string, boolean>
interface ModulePref {
  enabled: boolean
  flags: Flags
}
type DashboardItem = UserDashboardItemInput

export class MemoryPlatformStore implements PlatformStateStore {
  readonly label = "memory" as const
  private demoUserId = "demo-memory-user"
  private prefs: Record<string, ModulePref> = {}
  private catalog: Record<string, ModuleCatalogEntryProps> = {}
  private features: FeatureCatalogEntryProps[] = []
  private selections: Record<string, Record<string, UserSelection>> = {}
  private onboarding: Record<string, OnboardingState> = {}
  private dashboard: Record<string, DashboardItem[]> = {}

  async getDemoUserId(): Promise<string> {
    return this.demoUserId
  }

  async loadModuleOverrides(): Promise<ModuleOverrideMap> {
    const out: ModuleOverrideMap = {}
    for (const [id, p] of Object.entries(this.prefs)) {
      out[id] = { enabled: p.enabled, flags: { ...p.flags } }
    }
    return out
  }

  async setModuleFlag(moduleId: string, flagKey: string, value: boolean): Promise<void> {
    const pref = this.prefs[moduleId] ?? { enabled: true, flags: {} }
    pref.flags[flagKey] = value
    this.prefs[moduleId] = pref
  }

  async setModuleEnabled(moduleId: string, enabled: boolean): Promise<void> {
    const pref = this.prefs[moduleId] ?? { enabled, flags: {} }
    pref.enabled = enabled
    this.prefs[moduleId] = pref
  }

  async loadCatalogMap(): Promise<Record<string, ModuleCatalogEntryProps>> {
    return { ...this.catalog }
  }

  async upsertCatalogEntry(entry: ModuleCatalogEntryProps): Promise<void> {
    this.catalog[entry.moduleId] = { ...entry }
  }

  async loadFeatureCatalog(): Promise<FeatureCatalogEntryProps[]> {
    return this.features.map((f) => ({ ...f }))
  }

  async upsertFeatureCatalog(entry: FeatureCatalogEntryProps): Promise<void> {
    const ix = this.features.findIndex(
      (f) => f.moduleId === entry.moduleId && f.featureKey === entry.featureKey,
    )
    if (ix >= 0) this.features[ix] = { ...entry }
    else this.features.push({ ...entry })
  }

  async loadSelectionMap(userId: string): Promise<Record<string, UserSelection>> {
    return { ...(this.selections[userId] ?? {}) }
  }

  async bulkSetSelection(
    userId: string,
    selectedModuleIds: string[],
    availableModuleIds: string[],
  ): Promise<void> {
    const set = new Set(selectedModuleIds)
    const map: Record<string, UserSelection> = { ...(this.selections[userId] ?? {}) }
    for (const moduleId of availableModuleIds) {
      map[moduleId] = {
        moduleId,
        selected: set.has(moduleId),
        pinned: map[moduleId]?.pinned ?? false,
      }
    }
    this.selections[userId] = map
  }

  async loadOnboardingState(userId: string): Promise<OnboardingState> {
    return this.onboarding[userId] ?? initialState()
  }

  async saveOnboardingState(userId: string, state: OnboardingState): Promise<void> {
    this.onboarding[userId] = { ...state, payload: { ...state.payload } }
  }

  async resetOnboardingState(userId: string): Promise<void> {
    delete this.onboarding[userId]
    delete this.selections[userId]
    delete this.dashboard[userId]
  }

  async loadUserDashboardItems(userId: string): Promise<UserDashboardItemInput[]> {
    return [...(this.dashboard[userId] ?? [])].sort((a, b) => a.order - b.order)
  }

  async setDashboardItem(
    userId: string,
    moduleId: string,
    contributionKind: UserDashboardItemInput["contributionKind"],
    contributionKey: string,
    patch: { order?: number; visible?: boolean },
  ): Promise<void> {
    const items = this.dashboard[userId] ?? []
    const ix = items.findIndex(
      (i) =>
        i.moduleId === moduleId &&
        i.contributionKind === contributionKind &&
        i.contributionKey === contributionKey,
    )
    if (ix >= 0) {
      items[ix] = {
        ...items[ix],
        order: patch.order ?? items[ix].order,
        visible: patch.visible ?? items[ix].visible,
      }
    } else {
      items.push({
        moduleId,
        contributionKind,
        contributionKey,
        order: patch.order ?? 0,
        visible: patch.visible ?? true,
      })
    }
    this.dashboard[userId] = items
  }
}
