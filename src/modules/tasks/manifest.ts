import type { ModuleManifest } from "@host/core/contracts"
import { TasksBoardScreen } from "./presentation/screens/tasks-board-screen"
import { OpenTasksKpi, TasksByStatusWidget } from "./presentation/widgets/tasks-widgets"

export const tasksManifest: ModuleManifest = {
  id: "tasks",
  name: "Tasks",
  description: "Board com transições de status — prova fluxo com regra de domínio.",
  version: "2.0.0",
  status: "active",
  area: "main",
  icon: "ListChecks",
  order: 20,
  category: "Produtividade",
  tags: ["fluxo", "estado"],
  enabledByDefault: true,
  capabilities: ["tasks:read", "tasks:write"],

  // v2
  dependencies: [],
  supportedContexts: ["web", "desktop"],
  featureFlags: [
    {
      key: "mostrar-concluidas",
      label: "Mostrar tarefas concluídas",
      description:
        "Quando desligado, tarefas com status 'done' somem da lista. Pode ser alterado em Settings.",
      default: true,
    },
  ],
  contributions: [
    {
      kind: "home-highlight",
      title: "Ver quadro de tarefas",
      description: "Acompanhe o que está em aberto e o que já foi concluído.",
      to: "",
    },
    {
      kind: "dashboard-kpi",
      key: "open-tasks",
      label: "Tarefas em aberto",
      widgetKey: "openTasksKpi",
      order: 20,
    },
    {
      kind: "dashboard-widget",
      key: "tasks-by-status",
      title: "Tarefas por status",
      description: "Distribuição atual do board.",
      widgetKey: "tasksByStatus",
      size: "sm",
      order: 30,
    },
  ],

  routes: [{ path: "", screen: "board", label: "Tarefas" }],
  navigation: [{ label: "Tasks", path: "", icon: "ListChecks", order: 20 }],
  screens: {
    board: TasksBoardScreen,
  },
  widgets: {
    openTasksKpi: OpenTasksKpi,
    tasksByStatus: TasksByStatusWidget,
  },
}
