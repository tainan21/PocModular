import { Task, type TaskStatus } from "../domain/task"
import type { TasksRepository } from "./tasks-repository"

export type IdProvider = () => string

export async function createTask(
  deps: { repo: TasksRepository; id: IdProvider },
  input: { title: string; sourceNoteId?: string },
): Promise<Task> {
  const task = Task.create({
    id: deps.id(),
    title: input.title,
    sourceNoteId: input.sourceNoteId,
  })
  await deps.repo.save(task)
  return task
}

export async function findTaskBySourceNote(
  deps: { repo: TasksRepository },
  noteId: string,
): Promise<Task | null> {
  return deps.repo.findBySourceNoteId(noteId)
}

export async function listTasks(
  deps: { repo: TasksRepository },
  filter?: { status?: TaskStatus },
): Promise<Task[]> {
  return deps.repo.list(filter)
}

export async function changeTaskStatus(
  deps: { repo: TasksRepository },
  input: { id: string; status: TaskStatus },
): Promise<Task> {
  const task = await deps.repo.findById(input.id)
  if (!task) throw new Error(`Task ${input.id} não encontrada`)
  task.changeStatus(input.status)
  await deps.repo.save(task)
  return task
}

export async function deleteTask(
  deps: { repo: TasksRepository },
  input: { id: string },
): Promise<void> {
  await deps.repo.delete(input.id)
}
