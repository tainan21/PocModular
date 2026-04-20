import { handle } from "@server/platform/http"
import { getDashboardDTO } from "@server/platform/services/dashboard-service"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "user", () => getDashboardDTO())
}
