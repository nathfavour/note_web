import { Box, Skeleton, Stack, Typography } from '@mui/material'

export function WorkspaceLoading() {
  return (
    <Box sx={{ minHeight: '100%', pt: { xs: 0, md: 0 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: 'transparent', userSelect: 'none' }}>
          Notes
        </Typography>
        <Skeleton variant="text" width={240} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>

      <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />

      <Stack direction="row" spacing={1.5} sx={{ mb: 3, overflowX: 'auto' }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" width={88} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        ))}
      </Box>
    </Box>
  )
}
