/**
 * Regras puras do fluxo de onboarding. Sem I/O, sem Prisma, sem Next.
 *
 * O onboarding é um state machine simples de 3 passos.
 */

export type OnboardingIntent = "pessoal" | "time" | "operacao" | "explorar"

export interface OnboardingPayload {
  intent?: OnboardingIntent
  selectedModuleIds?: string[]
  dashboardModuleIds?: string[]
}

export interface OnboardingState {
  completed: boolean
  currentStep: number
  payload: OnboardingPayload
}

export const TOTAL_STEPS = 3

export function initialState(): OnboardingState {
  return { completed: false, currentStep: 1, payload: {} }
}

export function advance(state: OnboardingState): OnboardingState {
  if (state.completed) return state
  if (state.currentStep >= TOTAL_STEPS) {
    return { ...state, completed: true }
  }
  return { ...state, currentStep: state.currentStep + 1 }
}

export function stepLabels(): string[] {
  return ["Contexto", "Apps", "Dashboard"]
}

/**
 * Regras de validação por passo.
 */
export function canAdvance(state: OnboardingState): { ok: boolean; reason?: string } {
  switch (state.currentStep) {
    case 1:
      if (!state.payload.intent) return { ok: false, reason: "Escolha um contexto de uso." }
      return { ok: true }
    case 2:
      if (!state.payload.selectedModuleIds || state.payload.selectedModuleIds.length === 0) {
        return { ok: false, reason: "Escolha pelo menos um app." }
      }
      return { ok: true }
    case 3:
      return { ok: true }
    default:
      return { ok: true }
  }
}

/**
 * Presets de módulos sugeridos por intent.
 * Retorna lista sugerida; não decide final — o usuário escolhe em seguida.
 */
export function suggestedModulesForIntent(
  intent: OnboardingIntent,
  available: string[],
): string[] {
  const preset: Record<OnboardingIntent, string[]> = {
    pessoal: ["notes", "tasks"],
    time: ["tasks", "notes", "catalog"],
    operacao: ["catalog", "tasks"],
    explorar: available,
  }
  const wanted = preset[intent]
  return wanted.filter((id) => available.includes(id))
}
