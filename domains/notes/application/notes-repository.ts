/**
 * Contrato do repositório de Notes.
 *
 * A aplicação (use-cases) depende apenas deste contrato, nunca de Prisma.
 * A implementação concreta vive em `src/modules/notes/infra`.
 *
 * Isso permite, no futuro, trocar a infra (Prisma -> SQLite direto no Tauri,
 * ou HTTP, ou memória) sem tocar em use-cases ou domínio.
 */
import type { Note } from "../domain/note"

export interface NotesRepository {
  list(): Promise<Note[]>
  findById(id: string): Promise<Note | null>
  save(note: Note): Promise<void>
  delete(id: string): Promise<void>
}
