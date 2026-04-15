import { createFileRoute } from '@tanstack/react-router'
import SharedNoteClient from '@/app/shared/[noteid]/SharedNoteClient'

export const Route = createFileRoute('/shared/$noteid')({
  component: SharedNoteRoute,
})

function SharedNoteRoute() {
  const { noteid } = Route.useParams()
  const search = Route.useSearch()
  const initialKey = typeof search.key === 'string' ? search.key : undefined

  return <SharedNoteClient noteId={noteid} initialKey={initialKey} />
}
