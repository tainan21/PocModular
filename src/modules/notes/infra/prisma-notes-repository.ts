/**
 * Implementação concreta do NotesRepository usando Prisma.
 *
 * Esta é a camada de INFRA. Ela é a única que conhece Prisma neste módulo.
 * O domínio (domains/notes) continua zero acoplado ao framework/ORM.
 */
import { Note, type NotesRepository } from "@domains/notes"
import { prisma } from "@server/db/prisma"

export class PrismaNotesRepository implements NotesRepository {
  async list(): Promise<Note[]> {
    const rows = await prisma.note.findMany({ orderBy: { updatedAt: "desc" } })
    return rows.map((r) =>
      Note.hydrate({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
    )
  }

  async findById(id: string): Promise<Note | null> {
    const r = await prisma.note.findUnique({ where: { id } })
    if (!r) return null
    return Note.hydrate({
      id: r.id,
      title: r.title,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })
  }

  async save(note: Note): Promise<void> {
    const data = note.toJSON()
    await prisma.note.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        title: data.title,
        content: data.content,
        updatedAt: data.updatedAt,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.note.delete({ where: { id } }).catch(() => {
      /* idempotente */
    })
  }
}
