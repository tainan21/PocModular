import "server-only"
import { listTasks, type TaskStatus } from "@domains/tasks"
import { getTasksRepository } from "../infra/repository-factory"

export async function getAllTasks(filter?: { status?: TaskStatus }) {
  const tasks = await listTasks({ repo: getTasksRepository() }, filter)
  return tasks.map((t) => t.toJSON())
}
