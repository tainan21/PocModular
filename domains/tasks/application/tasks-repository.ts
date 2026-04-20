import type { Task, TaskStatus } from "../domain/task"

export interface TasksRepository {
  list(filter?: { status?: TaskStatus }): Promise<Task[]>
  findById(id: string): Promise<Task | null>
  /**
   * Interação entre módulos: Notes consulta para saber se já existe
   * uma task originada daquela nota (sem precisar conhecer o schema).
   */
  findBySourceNoteId(noteId: string): Promise<Task | null>
  save(task: Task): Promise<void>
  delete(id: string): Promise<void>
}
