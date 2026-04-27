import { createFileRoute } from '@tanstack/react-router'
import NotesPage from '@/app/(app)/notes/page'

export const Route = createFileRoute('/notes')({
  component: NotesRoute,
})

function NotesRoute() {
  return <NotesPage />
}
