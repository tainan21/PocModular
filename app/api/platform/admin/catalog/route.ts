import { handle, readJson } from "@server/platform/http"
import { saveCatalogEntry } from "@server/platform/services/admin-service"
import { adminSaveCatalogRequestSchema } from "@poc/platform-contracts/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  return handle(req, "admin", async ({ req }) => {
    const body = await readJson(req, adminSaveCatalogRequestSchema)
    return saveCatalogEntry(body)
  })
}
