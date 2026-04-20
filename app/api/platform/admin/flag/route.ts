import { handle, readJson } from "@server/platform/http"
import { setModuleFlag } from "@server/platform/services/admin-service"
import { adminSetFlagRequestSchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  return handle(req, "admin", async ({ req }) => {
    const body = await readJson(req, adminSetFlagRequestSchema)
    return setModuleFlag(body)
  })
}
