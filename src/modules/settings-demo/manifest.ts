import type { ModuleManifest } from "@host/core/contracts"
import { SettingsScreen } from "./presentation/screens/settings-screen"

export const settingsDemoManifest: ModuleManifest = {
  id: "settings-demo",
  name: "Settings",
  description: "Estado e flags dos módulos registrados. Persistência em banco.",
  version: "2.0.0",
  status: "active",
  area: "settings",
  icon: "Settings",
  order: 90,
  category: "Sistema",
  tags: ["configuração", "platform"],
  enabledByDefault: true,
  capabilities: ["system:read-config", "system:write-config"],

  // v2
  dependencies: [],
  supportedContexts: ["web", "desktop", "hub", "space"],
  featureFlags: [],
  contributions: [
    {
      kind: "home-highlight",
      title: "Ajustes da plataforma",
      description: "Habilite/desabilite módulos e ajuste flags em tempo real.",
      to: "",
    },
  ],

  routes: [
    { path: "", screen: "form", label: "Configurações" },
    { path: "for/:moduleId", screen: "form", label: "Configurar módulo" },
  ],
  navigation: [{ label: "Settings", path: "", icon: "Settings", order: 90 }],
  screens: {
    form: SettingsScreen,
  },
}
