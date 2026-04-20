/**
 * Impl em memória do TasksRepository.
 *
 * Serve DOIS propósitos:
 *  1. Manter a POC navegável quando o Prisma não puder atender
 *     (sandbox sem DB, DATABASE_URL inválida, schema não aplicado).
 *  2. Reforçar a afirmação arquitetural: o domínio não sabe quem o persiste.
 *
 * Estado vive no processo — recarregar apaga tudo. Em um host com múltiplos
 * workers, cada worker tem seu próprio "banco". É intencional.
 */
import { Task, type TasksRepository, type TaskStatus } from "@domains/tasks"

type Row = {
  id: string
  title: string
  status: TaskStatus
  sourceNoteId?: string
  createdAt: Date
  updatedAt: Date
}

// Singleton por import — todas as chamadas compartilham o mesmo mapa.
const store = new Map<string, Row>()

if (store.size === 0) {
  const now = new Date()
  store.set("mem-task-1", {
    id: "mem-task-1",
    title: "Task (memory) — POC",
    status: "todo",
    createdAt: now,
    updatedAt: now,
  })
}

function toDomain(r: Row): Task {
  return Task.hydrate({ ...r })
}

export class MemoryTasksRepository implements TasksRepository {
  async list(filter?: { status?: TaskStatus }): Promise<Task[]> {
    let rows = [...store.values()]
    if (filter?.status) {
      rows = rows.filter((r) => r.status === filter.status)
    }
    return rows
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toDomain)
  }

  async findById(id: string): Promise<Task | null> {
    const r = store.get(id)
    return r ? toDomain(r) : null
  }

  async findBySourceNoteId(noteId: string): Promise<Task | null> {
    const r = [...store.values()]
      .filter((r) => r.sourceNoteId === noteId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    return r ? toDomain(r) : null
  }

  async save(task: Task): Promise<void> {
    const data = task.toJSON()
    store.set(data.id, {
      id: data.id,
      title: data.title,
      status: data.status,
      sourceNoteId: data.sourceNoteId ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    store.delete(id)
  }
}
