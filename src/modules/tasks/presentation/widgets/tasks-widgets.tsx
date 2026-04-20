import { getAllTasks } from "../../application/queries"

export async function OpenTasksKpi() {
  const tasks = await getAllTasks()
  const open = tasks.filter((t) => t.status !== "done").length
  return <span className="font-mono text-3xl font-semibold tabular-nums">{open}</span>
}

export async function TasksByStatusWidget() {
  const tasks = await getAllTasks()
  const byStatus: Record<string, number> = { todo: 0, doing: 0, done: 0 }
  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
  }
  const order: Array<{ k: "todo" | "doing" | "done"; label: string }> = [
    { k: "todo", label: "A fazer" },
    { k: "doing", label: "Em andamento" },
    { k: "done", label: "Concluídas" },
  ]
  return (
    <div className="flex flex-col gap-2">
      {order.map(({ k, label }) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono tabular-nums">{byStatus[k] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}
