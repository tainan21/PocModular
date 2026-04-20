import Link from "next/link"
import { getRecentNotes, getNotesCount } from "../../application/queries"

export async function RecentNotesWidget() {
  const notes = await getRecentNotes(5)
  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem notas ainda.</p>
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {notes.map((n) => (
        <li key={n.id} className="py-2">
          <Link
            href={`/m/notes/${n.id}`}
            className="flex flex-col gap-0.5 hover:text-primary"
          >
            <span className="line-clamp-1 text-sm font-medium">{n.title}</span>
            {n.content ? (
              <span className="line-clamp-1 text-xs text-muted-foreground">{n.content}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export async function NotesCountKpi() {
  const count = await getNotesCount()
  return <span className="font-mono text-3xl font-semibold tabular-nums">{count}</span>
}
