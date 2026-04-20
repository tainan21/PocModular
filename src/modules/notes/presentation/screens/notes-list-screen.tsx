import Link from "next/link"
import { PageShell } from "@poc/module-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react"
import { getAllNotesWithLinkedTask } from "../../application/queries"
import { deleteNoteAction } from "../../application/actions"
import * as settingsApi from "../../../settings-demo/public-api"

/**
 * Screen: lista de notas.
 *
 * v2:
 *  - exibe badge de task linkada (conversa com módulo Tasks)
 *  - exibe pill do backend em uso (Prisma vs Memory)
 */
export async function NotesListScreen(props: { moduleBasePath: string }) {
  const items = await getAllNotesWithLinkedTask()
  const usingMemory = await settingsApi.getFeatureFlag(
    "notes",
    "usa-memory-repo",
    false,
  )

  return (
    <PageShell
      title="Notes"
      description="CRUD simples para validar persistência, domínio isolado do framework e conversa cross-módulo."
      actions={
        <Button asChild>
          <Link href={`${props.moduleBasePath}/new`}>
            <Plus className="size-4" />
            Nova nota
          </Link>
        </Button>
      }
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Backend ativo:</span>
        <Badge variant={usingMemory ? "secondary" : "outline"}>
          {usingMemory ? "MemoryNotesRepository" : "PrismaNotesRepository"}
        </Badge>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma nota ainda. Crie a primeira para validar o fluxo de escrita.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ note, task }) => (
            <Card key={note.id} className="flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base text-pretty">
                    {note.title}
                  </CardTitle>
                  {task && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 gap-1 whitespace-nowrap"
                    >
                      <ListChecks className="size-3" />
                      {task.status}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {note.content || "—"}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleString("pt-BR")}
                </span>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`${props.moduleBasePath}/edit/${note.id}`}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <form action={deleteNoteAction}>
                    <input type="hidden" name="id" value={note.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      <Trash2 className="size-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
