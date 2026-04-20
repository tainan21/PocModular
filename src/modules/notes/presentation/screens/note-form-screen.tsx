import Link from "next/link"
import { PageShell } from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ListChecks } from "lucide-react"
import { getNoteById } from "../../application/queries"
import {
  createNoteAction,
  promoteNoteToTaskAction,
  updateNoteAction,
} from "../../application/actions"
import { redirect } from "next/navigation"
import * as tasksApi from "../../../tasks/public-api"

/**
 * Screen: formulário de nota (criar OU editar).
 * O modo é determinado pelo param `:id` da rota.
 *
 * v2 — quando editando, mostra:
 *  - Badge se a nota já gerou uma task
 *  - Botão "Promover a tarefa" (ponte cross-módulo Notes -> Tasks)
 */
export async function NoteFormScreen(props: {
  params: Record<string, string>
  moduleBasePath: string
}) {
  const editingId = props.params.id
  const existing = editingId ? await getNoteById(editingId) : null
  const isEditing = Boolean(existing)
  const linkedTask = existing
    ? await tasksApi.getTaskBySourceNote(existing.id)
    : null

  async function submit(formData: FormData) {
    "use server"
    if (isEditing) {
      formData.set("id", editingId!)
      await updateNoteAction(formData)
    } else {
      await createNoteAction(formData)
    }
    redirect(props.moduleBasePath)
  }

  async function promote(formData: FormData) {
    "use server"
    formData.set("id", editingId!)
    await promoteNoteToTaskAction(formData)
  }

  return (
    <PageShell
      title={isEditing ? "Editar nota" : "Nova nota"}
      description={
        isEditing
          ? "Atualize o título e o conteúdo."
          : "Preencha o título e o conteúdo."
      }
      actions={
        <Button asChild variant="outline">
          <Link href={props.moduleBasePath}>
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      }
    >
      {isEditing && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Integração com Tasks
                </span>
                {linkedTask && (
                  <Badge variant="secondary">
                    Task criada: {linkedTask.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {linkedTask
                  ? `Esta nota já gerou a task "${linkedTask.title}".`
                  : "Transforme esta nota em uma tarefa no módulo Tasks."}
              </p>
            </div>
            <form action={promote}>
              <Button type="submit" variant="secondary">
                {linkedTask ? "Criar outra task" : "Promover a tarefa"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <form action={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                defaultValue={existing?.title ?? ""}
                required
                maxLength={120}
                placeholder="Ex: Arquitetura plugável"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={existing?.content ?? ""}
                rows={8}
                placeholder="Suas ideias..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">
                {isEditing ? "Salvar" : "Criar nota"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
