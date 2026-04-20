import type { ModuleManifest } from "@host/core/contracts"
import { WorkspaceHomeScreen } from "./presentation/screens/workspace-home-screen"

export const workspaceHomeManifest: ModuleManifest = {
  id: "workspace-home",
  name: "Workspace Home",
  description: "Dashboard componível do usuário, montado por contribuições.",
  version: "0.3.0",
  status: "active",
  area: "system",
  icon: "layout-dashboard",
  basePath: "/home",
  enabledByDefault: true,
  supportedContexts: ["web", "desktop"],
  dependencies: [],
  capabilities: ["read-user-dashboard"],
  contributions: [],
  routes: [{ path: "", screen: "home", label: "Dashboard" }],
  navigation: [{ label: "Dashboard", path: "", icon: "LayoutDashboard", order: 0 }],
  screens: { home: WorkspaceHomeScreen },
}
