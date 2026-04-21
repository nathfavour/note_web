import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/shared')({
  pendingComponent: SharedRoutePending,
  errorComponent: SharedRouteError,
  component: SharedRoute,
})

function SharedRoute() {
  return <Outlet />
}

function SharedRoutePending() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <CircularProgress sx={{ color: '#6366F1' }} />
    </Box>
  )
}

function SharedRouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'white', fontFamily: 'var(--font-clash)' }}>
          Shared route failed
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{error.message}</Typography>
        <Button variant="contained" onClick={reset} sx={{ bgcolor: '#6366F1', color: '#000', fontWeight: 800 }}>
          Retry
        </Button>
      </Stack>
    </Box>
  )
}
