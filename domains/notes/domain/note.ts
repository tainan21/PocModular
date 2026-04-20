/**
 * Entidade Note — pura. Zero dependência de framework.
 *
 * Esta classe poderia rodar em Node, Deno, Bun, Tauri ou Browser.
 * Nenhuma referência a React, Next, Prisma ou qualquer I/O.
 */
export interface NoteProps {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export class Note {
  private constructor(private props: NoteProps) {}

  static create(input: { id: string; title: string; content: string }): Note {
    const title = input.title.trim()
    if (title.length === 0) throw new Error("Note.title é obrigatório")
    if (title.length > 120) throw new Error("Note.title excede 120 caracteres")

    const now = new Date()
    return new Note({
      id: input.id,
      title,
      content: input.content.trim(),
      createdAt: now,
      updatedAt: now,
    })
  }

  static hydrate(props: NoteProps): Note {
    return new Note(props)
  }

  update(input: { title?: string; content?: string }): void {
    if (input.title !== undefined) {
      const t = input.title.trim()
      if (t.length === 0) throw new Error("Note.title é obrigatório")
      this.props.title = t
    }
    if (input.content !== undefined) {
      this.props.content = input.content.trim()
    }
    this.props.updatedAt = new Date()
  }

  toJSON(): NoteProps {
    return { ...this.props }
  }

  get id() {
    return this.props.id
  }
  get title() {
    return this.props.title
  }
  get content() {
    return this.props.content
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
}
