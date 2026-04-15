import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import NotesPage from '@/app/(app)/notes/page'

export const Route = createFileRoute('/notes')({
  component: NotesRoute,
})

function NotesRoute() {
  return (
    <AppLayoutContent>
      <NotesPage />
    </AppLayoutContent>
  )
}
