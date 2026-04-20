import { handle } from "@server/platform/http"
import { getModuleDTO } from "@server/platform/services/platform-service"
import { PlatformError } from "@poc/platform-contracts"

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params
  return handle(req, "public", async () => {
    const dto = await getModuleDTO(id)
    if (!dto) throw new PlatformError("not_found", `Módulo "${id}" não encontrado`)
    return dto
  })
}
