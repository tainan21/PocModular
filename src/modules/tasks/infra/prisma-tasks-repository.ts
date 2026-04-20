import { Task, type TasksRepository, type TaskStatus } from "@domains/tasks"
import { prisma } from "@server/db/prisma"

type Row = {
  id: string
  title: string
  status: string
  sourceNoteId: string | null
  createdAt: Date
  updatedAt: Date
}

function toDomain(r: Row): Task {
  return Task.hydrate({
    id: r.id,
    title: r.title,
    status: r.status as TaskStatus,
    sourceNoteId: r.sourceNoteId ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })
}

export class PrismaTasksRepository implements TasksRepository {
  async list(filter?: { status?: TaskStatus }): Promise<Task[]> {
    const rows = await prisma.task.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      orderBy: { createdAt: "desc" },
    })
    return rows.map(toDomain)
  }

  async findById(id: string): Promise<Task | null> {
    const r = await prisma.task.findUnique({ where: { id } })
    return r ? toDomain(r) : null
  }

  async findBySourceNoteId(noteId: string): Promise<Task | null> {
    const r = await prisma.task.findFirst({
      where: { sourceNoteId: noteId },
      orderBy: { createdAt: "desc" },
    })
    return r ? toDomain(r) : null
  }

  async save(task: Task): Promise<void> {
    const data = task.toJSON()
    await prisma.task.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        title: data.title,
        status: data.status,
        sourceNoteId: data.sourceNoteId ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        title: data.title,
        status: data.status,
        sourceNoteId: data.sourceNoteId ?? null,
        updatedAt: data.updatedAt,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } }).catch(() => {})
  }
}
