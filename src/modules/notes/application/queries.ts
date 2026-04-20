/**
 * Queries server-side do módulo Notes.
 * Chamadas diretamente de Server Components.
 */
import "server-only"
import { listNotes } from "@domains/notes"
import { getNotesRepository } from "../infra/repository-factory"
import * as tasksApi from "../../tasks/public-api"

export async function getAllNotes() {
  const repo = await getNotesRepository()
  const notes = await listNotes({ repo })
  return notes.map((n) => n.toJSON())
}

export async function getNoteById(id: string) {
  const repo = await getNotesRepository()
  const n = await repo.findById(id)
  return n?.toJSON() ?? null
}

/**
 * v2 — consulta cross-módulo: para cada nota, pergunta ao módulo Tasks
 * se ela já gerou uma task. Útil para mostrar badge na listagem.
 */
export async function getAllNotesWithLinkedTask() {
  const notes = await getAllNotes()
  const linked = await Promise.all(
    notes.map(async (n) => ({
      note: n,
      task: await tasksApi.getTaskBySourceNote(n.id),
    })),
  )
  return linked
}

/** Usado por widgets do dashboard. */
export async function getRecentNotes(limit = 5) {
  const all = await getAllNotes()
  return all.slice(0, limit)
}

export async function getNotesCount() {
  const all = await getAllNotes()
  return all.length
}
