import { handle, readQuery } from "@server/platform/http"
import { listCatalogDTO } from "@server/platform/services/platform-service"
import { catalogQuerySchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
  return handle(req, "public", async ({ req }) =>
    listCatalogDTO(readQuery(req, catalogQuerySchema)),
  )
}
