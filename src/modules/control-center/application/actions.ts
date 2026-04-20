"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getPlatformClient } from "@server/platform/client"
import type {
  PricingModelDTO,
  AdminSaveCatalogRequest,
} from "@poc/platform-contracts"

/**
 * Todas as actions do Control Center passam pelo PlatformClient.
 *
 * Consequência: quando um admin separado for consumir pela HTTP API,
 * a forma de invocar (payload, validação, erros) já está alinhada.
 * O Next server action daqui vira só "adapter" do form -> DTO.
 */

export async function saveCatalogEntryAction(formData: FormData): Promise<void> {
  const moduleId = String(formData.get("moduleId") ?? "")
  if (!moduleId) return

  const req: AdminSaveCatalogRequest = {
    moduleId,
    pricingModel: String(formData.get("pricingModel") ?? "free") as PricingModelDTO,
    priceCents: toNumberOrNull(formData.get("priceCents")),
    globallyEnabled: formData.get("globallyEnabled") === "on",
    visibleInOnboarding: formData.get("visibleInOnboarding") === "on",
    visibleInDashboard: formData.get("visibleInDashboard") === "on",
    featureFlagged: formData.get("featureFlagged") === "on",
    displayOrder: Number(formData.get("displayOrder") ?? 0),
  }

  await getPlatformClient().saveCatalog(req)
  revalidatePath("/", "layout")
}

export async function setModuleFlagAction(formData: FormData): Promise<void> {
  const moduleId = String(formData.get("moduleId") ?? "")
  const flagKey = String(formData.get("flagKey") ?? "")
  const nextValue = String(formData.get("nextValue") ?? "false") === "true"
  if (!moduleId || !flagKey) return

  await getPlatformClient().setFlag({ moduleId, flagKey, value: nextValue })
  revalidatePath("/", "layout")
}

/** Salva várias flags de um módulo de uma só vez (formulário com vários checkboxes). */
export async function saveFlagsAction(formData: FormData): Promise<void> {
  const moduleId = String(formData.get("moduleId") ?? "")
  if (!moduleId) return

  const platform = getPlatformClient()
  const detail = await platform.getModule(moduleId)
  if (!detail) return

  await Promise.all(
    detail.featureFlags.map((flag) =>
      platform.setFlag({
        moduleId,
        flagKey: flag.key,
        value: formData.get(`flag:${flag.key}`) === "on",
      }),
    ),
  )
  revalidatePath("/", "layout")
}

export async function resetOnboardingAction(): Promise<void> {
  await getPlatformClient().resetOnboarding()
  revalidatePath("/", "layout")
  redirect("/onboarding")
}

function toNumberOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
