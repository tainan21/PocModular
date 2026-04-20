"use server"

import { revalidatePath } from "next/cache"
import { changeTaskStatus, createTask, deleteTask, type TaskStatus } from "@domains/tasks"
import { getTasksRepository } from "../infra/repository-factory"

const id = () => crypto.randomUUID()

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "")
  await createTask({ repo: getTasksRepository(), id }, { title })
  revalidatePath("/m/tasks")
}

export async function changeTaskStatusAction(formData: FormData) {
  const taskId = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "") as TaskStatus
  await changeTaskStatus({ repo: getTasksRepository() }, { id: taskId, status })
  revalidatePath("/m/tasks")
}

export async function deleteTaskAction(formData: FormData) {
  const taskId = String(formData.get("id") ?? "")
  await deleteTask({ repo: getTasksRepository() }, { id: taskId })
  revalidatePath("/m/tasks")
}
