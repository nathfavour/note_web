import { createFileRoute } from '@tanstack/react-router'
import SharedNoteClient from '@/app/shared/[noteid]/SharedNoteClient'

export const Route = createFileRoute('/shared/$noteid/$key')({
  component: SharedNoteRoute,
})

function SharedNoteRoute() {
  const { noteid, key } = Route.useParams()
  return <SharedNoteClient noteId={noteid} initialKey={Array.isArray(key) ? key.join('/') : key} />
}
