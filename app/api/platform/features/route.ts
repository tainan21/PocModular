import { handle, readQuery } from "@server/platform/http"
import { listFeaturesDTO } from "@server/platform/services/platform-service"
import { featuresQuerySchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "public", async ({ req }) =>
    listFeaturesDTO(readQuery(req, featuresQuerySchema)),
  )
}
