import React, { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import AppLayoutContent from '@/app/(app)/AppLayoutContent'
import { WorkspaceLoading } from '@/components/ui/WorkspaceLoading'

const NotesPage = React.lazy(() => import('@/app/(app)/notes/page'))

export const Route = createFileRoute('/notes')({
  pendingComponent: NotesRoutePending,
  component: NotesRoute,
})

function NotesRoute() {
  return (
    <Suspense fallback={<NotesRoutePending />}>
      <AppLayoutContent>
        <NotesPage />
      </AppLayoutContent>
    </Suspense>
  )
}

function NotesRoutePending() {
  return (
    <AppLayoutContent>
      <WorkspaceLoading />
    </AppLayoutContent>
  )
}
