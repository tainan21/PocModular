import { renderModuleRoute } from "@host/runtime/render-module-route"

/**
 * Rota /admin[/*] — aponta para o módulo de sistema "control-center"
 * cujo manifest declara basePath: "/admin".
 *
 * O registry resolve /admin/... porque o módulo publicou basePath customizado.
 * O host não precisa saber que existe um "control-center".
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const path = slug && slug.length > 0 ? "/admin/" + slug.join("/") : "/admin"
  return renderModuleRoute(path)
}
