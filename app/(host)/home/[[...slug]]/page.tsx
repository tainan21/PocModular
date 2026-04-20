import { renderModuleRoute } from "@host/runtime/render-module-route"

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const path = slug && slug.length > 0 ? "/home/" + slug.join("/") : "/home"
  return renderModuleRoute(path)
}
