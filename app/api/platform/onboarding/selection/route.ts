import { handle, readJson } from "@server/platform/http"
import { setOnboardingSelection } from "@server/platform/services/onboarding-service"
import { onboardingSelectionRequestSchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  return handle(req, "user", async ({ req }) => {
    const body = await readJson(req, onboardingSelectionRequestSchema)
    return setOnboardingSelection(body.moduleIds)
  })
}
