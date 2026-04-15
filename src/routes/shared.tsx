import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import SharedNotesPage from '@/app/(app)/shared/page'

export const Route = createFileRoute('/shared')({
  component: SharedRoute,
})

function SharedRoute() {
  return (
    <AppLayoutContent>
      <SharedNotesPage />
    </AppLayoutContent>
  )
}
