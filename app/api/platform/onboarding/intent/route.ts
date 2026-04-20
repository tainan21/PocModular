import { handle, readJson } from "@server/platform/http"
import { setOnboardingIntent } from "@server/platform/services/onboarding-service"
import { onboardingIntentRequestSchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  return handle(req, "user", async ({ req }) => {
    const body = await readJson(req, onboardingIntentRequestSchema)
    return setOnboardingIntent(body.intent)
  })
}
