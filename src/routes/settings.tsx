import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import SettingsPage from '@/app/(app)/settings/page'

export const Route = createFileRoute('/settings')({
  component: SettingsRoute,
})

function SettingsRoute() {
  return (
    <AppLayoutContent>
      <SettingsPage />
    </AppLayoutContent>
  )
}
