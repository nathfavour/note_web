import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { createFileRoute, useLocation } from '@tanstack/react-router'
import SharedNoteClient from '@/app/shared/[noteid]/SharedNoteClient'
import { loadSharedNote, SharedNoteRouteError } from '@/lib/shared-note-loader'

export const Route = createFileRoute('/shared/$noteid')({
  loader: async ({ params, location }) => {
    const pathKey = location.pathname.split('/').filter(Boolean)[2]
    return loadSharedNote(params.noteid, pathKey)
  },
  pendingComponent: SharedNotePending,
  errorComponent: SharedNoteError,
  component: SharedNoteRoute,
})

function SharedNoteRoute() {
  const note = Route.useLoaderData()
  const { noteid } = Route.useParams()
  const location = useLocation()
  const pathKey = location.pathname.split('/').filter(Boolean)[2]
  return <SharedNoteClient noteId={noteid} initialKey={pathKey} initialNote={note} />
}

function SharedNotePending() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress sx={{ color: '#6366F1' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Fetching shared note…</Typography>
      </Stack>
    </Box>
  )
}

function SharedNoteError({ error, reset }: { error: Error; reset: () => void }) {
  const message = error instanceof SharedNoteRouteError ? error.message : error.message || 'Failed to load shared note.'
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'white', fontFamily: 'var(--font-clash)' }}>
          Unable to open shared note
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{message}</Typography>
        <Button variant="contained" onClick={reset} sx={{ bgcolor: '#6366F1', color: '#000', fontWeight: 800 }}>
          Retry
        </Button>
      </Stack>
    </Box>
  )
}
