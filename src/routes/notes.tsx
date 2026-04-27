import { createFileRoute } from '@tanstack/react-router'
import NotesPage from '@/app/(app)/notes/page'
import { getSnapshot } from '@/lib/auth-store'
import { redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/notes')({
  beforeLoad: () => {
    const state = getSnapshot()
    if (!state.isAuthenticated && !state.isLoading) {
      throw redirect({ to: '/' })
    }
  },
  component: NotesRoute,
})

function NotesRoute() {
  return <NotesPage />
}
