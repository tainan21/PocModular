import { handle } from "@server/platform/http"
import { getHealthDTO } from "@server/platform/services/platform-service"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "public", () => getHealthDTO())
}
