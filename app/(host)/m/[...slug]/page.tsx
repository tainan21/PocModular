import { renderModuleRoute } from "@host/runtime/render-module-route"

export default async function ModuleCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  return renderModuleRoute("/m/" + slug.join("/"))
}
