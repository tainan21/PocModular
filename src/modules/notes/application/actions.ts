"use server"

/**
 * Camada de *aplicação do módulo* (adaptador do runtime Next).
 *
 * As actions expostas aqui são a ponte entre:
 *   - A UI (React Server Components / formulários)
 *   - Os use-cases do domínio (framework-agnósticos)
 *
 * Os use-cases vivem em `domains/notes/application/use-cases.ts`.
 * Se um dia este app virar Tauri, estas actions ficam fora, mas os use-cases vão junto.
 */
import { revalidatePath } from "next/cache"
import { createNote, deleteNote, updateNote } from "@domains/notes"
import { getNotesRepository } from "../infra/repository-factory"
import * as tasksApi from "../../tasks/public-api"

const id = () => crypto.randomUUID()

export async function createNoteAction(formData: FormData) {
  const title = String(formData.get("title") ?? "")
  const content = String(formData.get("content") ?? "")
  const repo = await getNotesRepository()
  await createNote({ repo, id }, { title, content })
  revalidatePath("/m/notes")
}

export async function updateNoteAction(formData: FormData) {
  const noteId = String(formData.get("id") ?? "")
  const title = String(formData.get("title") ?? "")
  const content = String(formData.get("content") ?? "")
  const repo = await getNotesRepository()
  await updateNote({ repo }, { id: noteId, title, content })
  revalidatePath("/m/notes")
  revalidatePath(`/m/notes/edit/${noteId}`)
}

export async function deleteNoteAction(formData: FormData) {
  const noteId = String(formData.get("id") ?? "")
  const repo = await getNotesRepository()
  await deleteNote({ repo }, { id: noteId })
  revalidatePath("/m/notes")
}

/**
 * v2 — Conversa entre módulos: Notes cria uma Task
 * através da API pública do módulo Tasks.
 *
 * O módulo Notes NÃO conhece Prisma da Task, nem o schema,
 * nem sua entidade de domínio — só o contrato público.
 */
export async function promoteNoteToTaskAction(formData: FormData) {
  const noteId = String(formData.get("id") ?? "")
  const repo = await getNotesRepository()
  const note = await repo.findById(noteId)
  if (!note) return
  const json = note.toJSON()
  await tasksApi.createTaskFromExternal({
    title: json.title,
    sourceNoteId: json.id,
  })
  revalidatePath("/m/notes")
  revalidatePath(`/m/notes/edit/${noteId}`)
  revalidatePath("/m/tasks")
}
