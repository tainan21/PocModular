/**
 * PrismaPlatformStore — impl da porta PlatformStateStore usando Prisma.
 *
 * Delega aos helpers já existentes em src/host/runtime/*-state.ts para
 * consolidar I/O sem duplicar. `getDemoUserId` e `setModuleFlag` são
 * implementados aqui porque usam SQL direto.
 *
 * IMPORTANTE (v5.1): qualquer erro de datasource durante uma chamada real
 * (ex.: `URL must start with file:`, engine crash em SQLite, tabela
 * faltando) é propagado como `Error` normal. A factory em ./index.ts tem
 * um proxy em volta deste store que captura esses erros e, em vez de
 * estourar para o UI, degrada para memória permanentemente nesse worker.
 */

import type { PlatformStateStore } from "./store"
import { prisma } from "@server/db/prisma"
import { loadModuleOverrides, setModuleEnabled } from "@host/runtime/module-state"
import {
  loadCatalogMap,
  upsertCatalogEntry,
  loadFeatureCatalog,
  upsertFeatureCatalog,
} from "@host/runtime/catalog-state"
import { loadSelectionMap, bulkSetSelection } from "@host/runtime/selection-state"
import {
  loadOnboardingState,
  saveOnboardingState,
  resetOnboardingState,
} from "@host/runtime/onboarding-state"
import {
  loadUserDashboardItems,
  setDashboardItem,
} from "@host/runtime/dashboard-state"

const DEMO_USER_ID = "demo-user-1"

export class PrismaPlatformStore implements PlatformStateStore {
  readonly label = "prisma" as const

  loadModuleOverrides = loadModuleOverrides
  setModuleEnabled = setModuleEnabled

  loadCatalogMap = loadCatalogMap
  upsertCatalogEntry = upsertCatalogEntry
  loadFeatureCatalog = loadFeatureCatalog
  upsertFeatureCatalog = upsertFeatureCatalog

  loadSelectionMap = loadSelectionMap
  bulkSetSelection = bulkSetSelection

  loadOnboardingState = loadOnboardingState
  saveOnboardingState = saveOnboardingState
  resetOnboardingState = resetOnboardingState

  loadUserDashboardItems = loadUserDashboardItems
  setDashboardItem = setDashboardItem

  /**
   * Trazido para dentro do store em v5.1. Antes delegava para
   * `@host/runtime/demo-user.ts`, o que escondia a dependência Prisma e
   * impedia que a fachada capturasse erros de datasource aqui.
   */
  async getDemoUserId(): Promise<string> {
    const user = await prisma.demoUser.upsert({
      where: { id: DEMO_USER_ID },
      update: {},
      create: { id: DEMO_USER_ID, name: "Demo User" },
      select: { id: true },
    })
    return user.id
  }

  async setModuleFlag(moduleId: string, flagKey: string, value: boolean): Promise<void> {
    const existing = await prisma.modulePreference.findUnique({ where: { moduleId } })
    const current = safeParse(existing?.settingsJson) ?? {}
    current[`flag:${flagKey}`] = value
    const settingsJson = JSON.stringify(current)
    await prisma.modulePreference.upsert({
      where: { moduleId },
      create: { moduleId, enabled: true, order: 0, settingsJson },
      update: { settingsJson },
    })
  }
}

function safeParse(v: string | null | undefined): Record<string, unknown> | null {
  if (!v) return null
  try {
    return JSON.parse(v) as Record<string, unknown>
  } catch {
    return null
  }
}
