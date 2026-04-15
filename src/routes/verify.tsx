import { createFileRoute } from '@tanstack/react-router'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { EmailVerificationReminder } from '@/components/ui/EmailVerificationReminder'

export const Route = createFileRoute('/verify')({
  component: VerifyPage,
})

function VerifyPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: '#000' }}>
      <Paper sx={{ p: 4, width: 'min(560px, 100%)', bgcolor: '#161412', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)' }}>Verify your email</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Your account is protected by email verification. Return to the app after you confirm the message in your inbox.
          </Typography>
          <EmailVerificationReminder />
          <Button href="/landing" variant="outlined" sx={{ alignSelf: 'flex-start', color: 'white', borderColor: 'rgba(255,255,255,0.12)' }}>
            Back to landing
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
