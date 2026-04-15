import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import NotePage from '@/app/(app)/notes/[id]/page'

export const Route = createFileRoute('/notes/$id')({
  component: NoteRoute,
})

function NoteRoute() {
  return (
    <AppLayoutContent>
      <NotePage />
    </AppLayoutContent>
  )
}
