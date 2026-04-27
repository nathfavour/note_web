import { createFileRoute } from '@tanstack/react-router'
import NotesPage from '@/app/(app)/notes/page'
import { initAuth } from '@/lib/auth-store'

export const Route = createFileRoute('/notes')({
  beforeLoad: async () => {
    if (typeof window !== 'undefined') {
      await initAuth()
    }
  },
  component: NotesRoute,
})

function NotesRoute() {
  return <NotesPage />
}
