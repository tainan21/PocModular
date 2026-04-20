import type { ModuleManifest } from "@host/core/contracts"
import { ControlCenterScreen } from "./presentation/screens/control-center-screen"
import { ControlCenterFlagsScreen } from "./presentation/screens/control-center-flags-screen"

export const controlCenterManifest: ModuleManifest = {
  id: "control-center",
  name: "Control Center",
  description: "Administração da plataforma: catálogo, flags e seleção de módulos.",
  version: "0.3.0",
  status: "active",
  area: "system",
  icon: "shield",
  basePath: "/admin",
  enabledByDefault: true,
  // Módulos de sistema não são "vendidos" nem escolhíveis; sempre ativos.
  supportedContexts: ["web", "desktop"],
  // Administra os outros módulos, mas não depende deles para renderizar sua home.
  dependencies: [],
  capabilities: [
    "read-registry",
    "write-catalog",
    "write-selection",
    "write-preferences",
  ],
  // Control Center não publica widgets — ele é consumidor do registry.
  contributions: [],
  routes: [
    { path: "", screen: "home", label: "Visão geral" },
    { path: "flags/:moduleId", screen: "flags", label: "Feature flags" },
  ],
  navigation: [{ path: "", label: "Control Center" }],
  screens: {
    home: ControlCenterScreen,
    flags: ControlCenterFlagsScreen,
  },
}
