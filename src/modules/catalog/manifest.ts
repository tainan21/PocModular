import type { ModuleManifest } from "@host/core/contracts"
import { CatalogListScreen } from "./presentation/screens/catalog-list-screen"
import { CatalogHighlightsWidget } from "./presentation/widgets/catalog-widgets"

export const catalogManifest: ModuleManifest = {
  id: "catalog",
  name: "Catalog",
  description: "Listagem read-only com filtro por categoria.",
  version: "2.0.0",
  status: "experimental",
  area: "main",
  icon: "BookOpen",
  order: 30,
  category: "Leitura",
  tags: ["leitura", "listagem"],
  enabledByDefault: true,
  capabilities: ["catalog:read"],

  // v2
  dependencies: [],
  supportedContexts: ["web", "desktop", "hub"],
  featureFlags: [],
  contributions: [
    {
      kind: "home-highlight",
      title: "Explorar catálogo",
      description: "Conteúdo read-only, bom para provar leitura estruturada.",
      to: "",
    },
    {
      kind: "dashboard-widget",
      key: "catalog-highlights",
      title: "Destaques do catálogo",
      description: "Primeiros itens publicados.",
      widgetKey: "catalogHighlights",
      size: "md",
      order: 40,
    },
  ],

  routes: [
    { path: "", screen: "list", label: "Catálogo" },
    { path: "category/:category", screen: "list", label: "Categoria" },
  ],
  navigation: [{ label: "Catalog", path: "", icon: "BookOpen", order: 30 }],
  screens: {
    list: CatalogListScreen,
  },
  widgets: {
    catalogHighlights: CatalogHighlightsWidget,
  },
}
