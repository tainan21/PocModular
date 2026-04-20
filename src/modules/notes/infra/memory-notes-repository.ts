/**
 * Implementação ALTERNATIVA do NotesRepository, 100% em memória.
 *
 * Existe para provar uma afirmação arquitetural central da POC:
 * a aplicação/domínio é independente da infraestrutura.
 *
 * O mesmo domínio, os mesmos use-cases, a mesma UI funcionam
 * com Prisma OU com esta implementação — a troca é na fábrica.
 *
 * Limitação intencional: o estado vive no processo.
 * Em dev com múltiplos workers cada worker tem seu próprio "banco".
 */
import { Note, type NotesRepository } from "@domains/notes"

type Row = {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

// "Banco" compartilhado no processo (singleton por arquivo).
const store = new Map<string, Row>()

// seeds iniciais para a experiência não ficar vazia
if (store.size === 0) {
  const now = new Date()
  store.set("mem-1", {
    id: "mem-1",
    title: "Nota (memory) — POC v2",
    content:
      "Este repositório roda em memória. Recarregar o processo apaga tudo.\n" +
      "Desligue a flag 'usa-memory-repo' em Settings para voltar ao Prisma.",
    createdAt: now,
    updatedAt: now,
  })
}

function toDomain(r: Row): Note {
  return Note.hydrate({ ...r })
}

export class MemoryNotesRepository implements NotesRepository {
  async list(): Promise<Note[]> {
    return [...store.values()]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(toDomain)
  }

  async findById(id: string): Promise<Note | null> {
    const r = store.get(id)
    return r ? toDomain(r) : null
  }

  async save(note: Note): Promise<void> {
    const data = note.toJSON()
    store.set(data.id, { ...data })
  }

  async delete(id: string): Promise<void> {
    store.delete(id)
  }
}
