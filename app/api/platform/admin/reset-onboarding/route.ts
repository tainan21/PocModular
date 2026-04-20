import { handle } from "@server/platform/http"
import { resetOnboarding } from "@server/platform/services/onboarding-service"

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  return handle(req, "admin", () => resetOnboarding())
}
