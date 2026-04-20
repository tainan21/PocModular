import { handle } from "@server/platform/http"
import { getOnboardingSnapshotDTO } from "@server/platform/services/onboarding-service"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "user", () => getOnboardingSnapshotDTO())
}
