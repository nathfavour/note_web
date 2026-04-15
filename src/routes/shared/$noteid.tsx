import { createFileRoute } from '@tanstack/react-router'
import SharedNoteClient from '@/app/shared/[noteid]/SharedNoteClient'
import { useSearchParams } from '@/compat/next-navigation'

export const Route = createFileRoute('/shared/$noteid')({
  component: SharedNoteRoute,
})

function SharedNoteRoute() {
  const { noteid } = Route.useParams()
  const search = useSearchParams()
  const initialKey = search.get('key') || undefined

  return <SharedNoteClient noteId={noteid} initialKey={initialKey} />
}
