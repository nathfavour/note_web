import { createFileRoute } from '@tanstack/react-router'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

export const Route = createFileRoute('/reset')({
  component: ResetPage,
})

function ResetPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: '#000' }}>
      <Paper sx={{ p: 4, width: 'min(560px, 100%)', bgcolor: '#161412', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)' }}>Reset access</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Use this entry point to recover your account or continue the password reset flow.
          </Typography>
          <Button href="/landing" variant="outlined" sx={{ alignSelf: 'flex-start', color: 'white', borderColor: 'rgba(255,255,255,0.12)' }}>
            Back to landing
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
