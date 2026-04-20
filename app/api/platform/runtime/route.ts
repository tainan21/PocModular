import { handle, readQuery } from "@server/platform/http"
import { listRuntimeDTO } from "@server/platform/services/platform-service"
import { runtimeQuerySchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "public", async ({ req }) =>
    listRuntimeDTO(readQuery(req, runtimeQuerySchema)),
  )
}
