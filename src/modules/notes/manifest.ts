import type { ModuleManifest } from "@host/core/contracts"
import { NotesListScreen } from "./presentation/screens/notes-list-screen"
import { NoteFormScreen } from "./presentation/screens/note-form-screen"
import {
  RecentNotesWidget,
  NotesCountKpi,
} from "./presentation/widgets/recent-notes-widget"

/**
 * Manifest do módulo Notes (v2).
 * Declara agora dependências, flags, contribuições e contextos suportados.
 */
export const notesManifest: ModuleManifest = {
  id: "notes",
  name: "Notes",
  description: "CRUD de notas — prova persistência e fluxo de escrita.",
  version: "2.0.0",
  status: "active",
  area: "main",
  icon: "Notebook",
  order: 10,
  category: "Produtividade",
  tags: ["crud", "persistência"],
  enabledByDefault: true,
  capabilities: ["notes:read", "notes:write"],

  // v2
  dependencies: [],
  supportedContexts: ["web", "desktop"],
  featureFlags: [
    {
      key: "usa-memory-repo",
      label: "Usar repositório em memória",
      description:
        "Troca a implementação Prisma por uma implementação in-memory. Prova portabilidade da infra.",
      default: false,
    },
  ],
  contributions: [
    {
      kind: "home-highlight",
      title: "Capturar nota rápida",
      description: "Crie uma nota e (opcionalmente) promova a tarefa.",
      to: "new",
    },
    { kind: "quick-action", key: "new-note", label: "Nova nota", to: "new", tone: "primary" },
    {
      kind: "dashboard-kpi",
      key: "total-notes",
      label: "Notas",
      widgetKey: "notesCountKpi",
      order: 10,
    },
    {
      kind: "dashboard-widget",
      key: "recent-notes",
      title: "Notas recentes",
      description: "Últimas notas criadas.",
      widgetKey: "recentNotes",
      size: "md",
      order: 20,
    },
  ],

  routes: [
    { path: "", screen: "list", label: "Notas" },
    { path: "new", screen: "form", label: "Nova" },
    { path: "edit/:id", screen: "form", label: "Editar" },
  ],
  navigation: [{ label: "Notes", path: "", icon: "Notebook", order: 10 }],
  screens: {
    list: NotesListScreen,
    form: NoteFormScreen,
  },
  widgets: {
    recentNotes: RecentNotesWidget,
    notesCountKpi: NotesCountKpi,
  },
}
