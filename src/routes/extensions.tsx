import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import ExtensionsPage from '@/app/(app)/extensions/page'

export const Route = createFileRoute('/extensions')({
  component: ExtensionsRoute,
})

function ExtensionsRoute() {
  return (
    <AppLayoutContent>
      <ExtensionsPage />
    </AppLayoutContent>
  )
}
