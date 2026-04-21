import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import AppLayoutShell from '@/components/AppLayoutShell'
import SharedNotesPage from '@/app/(app)/shared/page'

export const Route = createFileRoute('/shared/')({
  pendingComponent: SharedIndexPending,
  errorComponent: SharedIndexError,
  component: SharedIndexRoute,
})

function SharedIndexRoute() {
  return (
    <AppLayoutShell>
      <SharedNotesPage />
    </AppLayoutShell>
  )
}

function SharedIndexPending() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <CircularProgress sx={{ color: '#6366F1' }} />
    </Box>
  )
}

function SharedIndexError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'white', fontFamily: 'var(--font-clash)' }}>
          Shared notes failed
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{error.message}</Typography>
        <Button variant="contained" onClick={reset} sx={{ bgcolor: '#6366F1', color: '#000', fontWeight: 800 }}>
          Retry
        </Button>
      </Stack>
    </Box>
  )
}
