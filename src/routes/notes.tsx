import React, { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { StartupShell } from '@/components/ui/StartupShell'

const AppLayoutShell = React.lazy(() => import('@/components/AppLayoutShell'))
const NotesPage = React.lazy(() => import('@/app/(app)/notes/page'))

export const Route = createFileRoute('/notes')({
  pendingComponent: NotesRoutePending,
  component: NotesRoute,
})

function NotesRoute() {
  return (
    <Suspense fallback={<NotesRoutePending />}>
      <AppLayoutShell>
        <NotesPage />
      </AppLayoutShell>
    </Suspense>
  )
}

function NotesRoutePending() {
  return <StartupShell />
}
