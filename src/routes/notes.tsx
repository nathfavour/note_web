import React, { Suspense } from 'react'
import { Box, Skeleton, Stack } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

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
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', color: '#fff' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 88,
          px: { xs: 2, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          bgcolor: 'rgba(10,9,8,0.92)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Skeleton variant="rounded" width={160} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Skeleton variant="rounded" width={110} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      </Box>

      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 88px)' }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 280,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            p: 2.5,
          }}
        >
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
          <Skeleton variant="text" width={180} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 2 }} />
          <Skeleton variant="text" width={260} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />
          <Stack spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
