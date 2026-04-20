/**
 * Agregador de manifests.
 *
 * Este é o ÚNICO ponto onde os módulos da plataforma são listados.
 * Para plugar/desplugar um módulo, mexa aqui e em lugar nenhum mais.
 *
 * O host não importa módulos; importa apenas esta lista.
 * Essa convenção substitui "descoberta mágica" e mantém o fluxo óbvio.
 */
import type { ModuleManifest } from "@host/core/contracts"
import { notesManifest } from "./notes/manifest"
import { tasksManifest } from "./tasks/manifest"
import { catalogManifest } from "./catalog/manifest"
import { settingsDemoManifest } from "./settings-demo/manifest"
import { controlCenterManifest } from "./control-center/manifest"
import { workspaceHomeManifest } from "./workspace-home/manifest"

export const allManifests: ModuleManifest[] = [
  workspaceHomeManifest,
  notesManifest,
  tasksManifest,
  catalogManifest,
  settingsDemoManifest,
  controlCenterManifest,
]
