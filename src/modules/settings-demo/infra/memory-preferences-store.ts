/**
 * Fallback em memória para ModulePreference, usado quando a tabela Prisma
 * falha em tempo de execução. Estado por processo — igual aos outros
 * memory repos. Usado por `application/queries.ts` e `application/actions.ts`
 * via o helper `withDatasourceFallback`.
 */

export interface MemoryPreferenceRow {
  moduleId: string
  enabled: boolean
  order: number
  settingsJson: string
  updatedAt: Date
}

const store = new Map<string, MemoryPreferenceRow>()

export interface MemoryPreferencesPort {
  findUnique(moduleId: string): Promise<MemoryPreferenceRow | null>
  findMany(): Promise<MemoryPreferenceRow[]>
  upsert(
    moduleId: string,
    data: { enabled: boolean; order: number; settingsJson: string },
  ): Promise<void>
}

export const memoryPreferencesPort: MemoryPreferencesPort = {
  async findUnique(moduleId) {
    return store.get(moduleId) ?? null
  },
  async findMany() {
    return [...store.values()].sort((a, b) =>
      a.moduleId.localeCompare(b.moduleId),
    )
  },
  async upsert(moduleId, data) {
    store.set(moduleId, { moduleId, ...data, updatedAt: new Date() })
  },
}
