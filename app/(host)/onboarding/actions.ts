"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getPlatformClient } from "@server/platform/client"

/**
 * Todas as transições do onboarding passam pela Platform API.
 * Este arquivo é só o adapter Form -> DTO para o host web.
 */

export async function setOnboardingIntentAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "explorar")
  await getPlatformClient().setOnboardingIntent(intent)
  redirect("/onboarding/2")
}

export async function setOnboardingSelectionAction(formData: FormData) {
  const selectedModuleIds = formData.getAll("moduleId").map(String)
  await getPlatformClient().setOnboardingSelection(selectedModuleIds)
  redirect("/onboarding/3")
}

export async function finishOnboardingAction() {
  await getPlatformClient().finishOnboarding()
  revalidatePath("/home")
  redirect("/home")
}

export async function resetOnboardingAction() {
  await getPlatformClient().resetOnboarding()
  redirect("/onboarding")
}
