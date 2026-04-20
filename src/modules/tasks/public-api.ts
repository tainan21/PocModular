/**
 * API pública do módulo Tasks consumível por OUTROS módulos.
 *
 * Regras da ponte cross-módulo:
 *  - só expõe DTOs/primitivos (nunca entidades do domínio)
 *  - só expõe operações, não repositórios
 *  - fica pequena, explícita e estável
 *  - o consumidor (ex.: Notes) só depende deste arquivo
 *
 * Isso é o equivalente pragmático de uma "integration API" entre módulos.
 */
import { randomUUID } from "node:crypto"
import { createTask, findTaskBySourceNote } from "@domains/tasks"
import { getTasksRepository } from "./infra/repository-factory"

// `deps` precisa ser recalculado por chamada caso o fallback tenha trocado
// a instância subjacente, mas como `getTasksRepository()` retorna um Proxy
// estável, podemos cachear aqui.
const deps = { repo: getTasksRepository(), id: () => randomUUID() }

export type CrossModuleTaskSummary = {
  id: string
  title: string
  status: string
}

/**
 * Cria uma task originada por outro módulo (ex.: Notes).
 * Devolve um resumo neutro — nunca a entidade Task do domínio.
 */
export async function createTaskFromExternal(input: {
  title: string
  sourceNoteId?: string
}): Promise<CrossModuleTaskSummary> {
  const task = await createTask(deps, input)
  const json = task.toJSON()
  return { id: json.id, title: json.title, status: json.status }
}

/**
 * Consulta usada pelo Notes para saber se já existe uma task
 * que nasceu daquela nota.
 */
export async function getTaskBySourceNote(
  noteId: string,
): Promise<CrossModuleTaskSummary | null> {
  const task = await findTaskBySourceNote(deps, noteId)
  if (!task) return null
  const json = task.toJSON()
  return { id: json.id, title: json.title, status: json.status }
}
