/**
 * I/O do state do onboarding do usuário.
 * Adapta Prisma <-> domínio puro (onboarding).
 */
import { prisma } from "@server/db/prisma"
import type {
  OnboardingPayload,
  OnboardingState,
} from "@domains/onboarding/application/onboarding-rules"
import { initialState } from "@domains/onboarding/application/onboarding-rules"

export async function loadOnboardingState(
  userId: string,
): Promise<OnboardingState> {
  const row = await prisma.userOnboardingState.findUnique({ where: { userId } })
  if (!row) return initialState()
  return {
    completed: row.completed,
    currentStep: row.currentStep,
    payload: safeParse<OnboardingPayload>(row.payloadJson) ?? {},
  }
}

export async function saveOnboardingState(
  userId: string,
  state: OnboardingState,
): Promise<void> {
  const payloadJson = JSON.stringify(state.payload ?? {})
  await prisma.userOnboardingState.upsert({
    where: { userId },
    create: {
      userId,
      completed: state.completed,
      currentStep: state.currentStep,
      payloadJson,
    },
    update: {
      completed: state.completed,
      currentStep: state.currentStep,
      payloadJson,
    },
  })
}

/**
 * Reseta completamente o onboarding + seleção + dashboard do usuário.
 * Útil para demos do fluxo. Não toca no catálogo nem nos manifests.
 */
export async function resetOnboardingState(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.userOnboardingState.deleteMany({ where: { userId } }),
    prisma.userModuleSelection.deleteMany({ where: { userId } }),
    prisma.userDashboardItem.deleteMany({ where: { userId } }),
  ])
}

function safeParse<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}
