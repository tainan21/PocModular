import { handle, readQuery } from "@server/platform/http"
import { listModulesDTO } from "@server/platform/services/platform-service"
import { modulesQuerySchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "public", async ({ req }) =>
    listModulesDTO(readQuery(req, modulesQuerySchema)),
  )
}
