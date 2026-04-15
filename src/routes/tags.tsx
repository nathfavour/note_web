import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import TagsPage from '@/app/(app)/tags/page'

export const Route = createFileRoute('/tags')({
  component: TagsRoute,
})

function TagsRoute() {
  return (
    <AppLayoutContent>
      <TagsPage />
    </AppLayoutContent>
  )
}
