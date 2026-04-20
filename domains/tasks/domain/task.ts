/**
 * Entidade Task — domínio puro.
 * Prova que regras de transição de estado moram no domínio, não na UI.
 *
 * v2: Task pode opcionalmente referenciar uma Note de origem — é como
 * o domínio permite rastreabilidade sem acoplamento a outro módulo.
 * Note que o tipo é apenas string; Task.domain NÃO sabe o que é Note.
 */
export type TaskStatus = "todo" | "doing" | "done"

export interface TaskProps {
  id: string
  title: string
  status: TaskStatus
  /**
   * Origem externa opcional. Um id livre que identifica de onde a task
   * nasceu (ex.: uma note). O domínio não interpreta esta referência.
   */
  sourceNoteId?: string | null
  createdAt: Date
  updatedAt: Date
}

const VALID_STATUSES: readonly TaskStatus[] = ["todo", "doing", "done"]

export class Task {
  private constructor(private props: TaskProps) {}

  static create(input: { id: string; title: string; sourceNoteId?: string | null }): Task {
    const title = input.title.trim()
    if (!title) throw new Error("Task.title é obrigatório")
    const now = new Date()
    return new Task({
      id: input.id,
      title,
      status: "todo",
      sourceNoteId: input.sourceNoteId ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static hydrate(props: TaskProps): Task {
    if (!VALID_STATUSES.includes(props.status)) {
      throw new Error(`Task.status inválido: ${props.status}`)
    }
    return new Task(props)
  }

  /** Regra de domínio: transições permitidas. */
  changeStatus(next: TaskStatus): void {
    if (!VALID_STATUSES.includes(next)) {
      throw new Error(`status inválido: ${next}`)
    }
    if (this.props.status === "todo" && next === "done") {
      throw new Error("Mova a tarefa para 'doing' antes de concluí-la")
    }
    this.props.status = next
    this.props.updatedAt = new Date()
  }

  toJSON(): TaskProps {
    return { ...this.props }
  }

  get id() { return this.props.id }
  get title() { return this.props.title }
  get status() { return this.props.status }
  get sourceNoteId() { return this.props.sourceNoteId ?? null }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }
}
