/**
 * Casos de uso de Notes — framework-agnósticos.
 *
 * Cada use-case recebe suas dependências por injeção (via construtor ou factory).
 * Isso mantém a camada de aplicação independente de onde ela roda.
 */
import { Note } from "../domain/note"
import type { NotesRepository } from "./notes-repository"

// --- ID provider ------------------------------------------------------------
// Abstraímos geração de ID para não depender de lib específica no domínio.
export type IdProvider = () => string

// --- Create -----------------------------------------------------------------
export interface CreateNoteInput {
  title: string
  content: string
}

export async function createNote(
  deps: { repo: NotesRepository; id: IdProvider },
  input: CreateNoteInput,
): Promise<Note> {
  const note = Note.create({ id: deps.id(), title: input.title, content: input.content })
  await deps.repo.save(note)
  return note
}

// --- List -------------------------------------------------------------------
export async function listNotes(deps: { repo: NotesRepository }): Promise<Note[]> {
  return deps.repo.list()
}

// --- Update -----------------------------------------------------------------
export interface UpdateNoteInput {
  id: string
  title?: string
  content?: string
}

export async function updateNote(
  deps: { repo: NotesRepository },
  input: UpdateNoteInput,
): Promise<Note> {
  const note = await deps.repo.findById(input.id)
  if (!note) throw new Error(`Note ${input.id} não encontrada`)
  note.update({ title: input.title, content: input.content })
  await deps.repo.save(note)
  return note
}

// --- Delete -----------------------------------------------------------------
export async function deleteNote(
  deps: { repo: NotesRepository },
  input: { id: string },
): Promise<void> {
  await deps.repo.delete(input.id)
}
