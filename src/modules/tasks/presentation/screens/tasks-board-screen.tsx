import { PageShell } from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Sparkles } from "lucide-react"
import Link from "next/link"
import type { TaskStatus } from "@domains/tasks"
import { getAllTasks } from "../../application/queries"
import {
  createTaskAction,
  changeTaskStatusAction,
  deleteTaskAction,
} from "../../application/actions"
import * as settingsApi from "../../../settings-demo/public-api"

const STATUSES: { key: TaskStatus; label: string; next?: TaskStatus }[] = [
  { key: "todo", label: "A fazer", next: "doing" },
  { key: "doing", label: "Em andamento", next: "done" },
  { key: "done", label: "Concluído" },
]

/**
 * Screen única: board simples com 3 colunas por status.
 *
 * v2:
 *  - respeita a flag `mostrar-concluidas` (definida em Settings) para ocultar a coluna "done"
 *  - mostra origem "note" quando a task foi criada via Notes (conversa cross-módulo)
 */
export async function TasksBoardScreen() {
  const tasks = await getAllTasks()
  const showDone = await settingsApi.getFeatureFlag(
    "tasks",
    "mostrar-concluidas",
    true,
  )
  const visibleStatuses = showDone
    ? STATUSES
    : STATUSES.filter((s) => s.key !== "done")
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s)

  return (
    <PageShell
      title="Tasks"
      description="Board com estado simples. Regra de domínio: não pode pular de 'A fazer' direto para 'Concluído'."
    >
      {!showDone && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          A flag <code>mostrar-concluidas</code> está desligada. Tarefas em
          &quot;Concluído&quot; estão ocultas — ajuste em{" "}
          <Link
            href="/m/settings-demo/for/tasks"
            className="underline underline-offset-2"
          >
            Settings / Tasks
          </Link>
          .
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form action={createTaskAction} className="flex items-center gap-2">
            <Input name="title" required placeholder="Nova tarefa…" />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <div
        className={`grid gap-4 ${
          visibleStatuses.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {visibleStatuses.map((col) => (
          <Card key={col.key} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">{col.label}</CardTitle>
              <Badge variant="secondary">{byStatus(col.key).length}</Badge>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2">
              {byStatus(col.key).length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa nesta coluna.
                </p>
              ) : (
                byStatus(col.key).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <span className="flex-1 text-sm text-pretty">
                        {task.title}
                      </span>
                      {task.sourceNoteId && (
                        <Badge
                          variant="outline"
                          className="gap-1 whitespace-nowrap text-[10px]"
                          title="Esta task foi criada a partir de uma nota"
                        >
                          <Sparkles className="size-3" />
                          via Notes
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {col.next ? (
                        <form action={changeTaskStatusAction}>
                          <input type="hidden" name="id" value={task.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={col.next}
                          />
                          <Button size="sm" variant="ghost" type="submit">
                            →
                          </Button>
                        </form>
                      ) : null}
                      <form action={deleteTaskAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <Button size="sm" variant="ghost" type="submit">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
