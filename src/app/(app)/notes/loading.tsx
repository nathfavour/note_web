import { Box, Skeleton, Stack } from '@mui/material';

export default function NotesLoading() {
  return (
    <Box sx={{ minHeight: '100vh', px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={160} height={52} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Skeleton variant="text" width={280} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>

      <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />

      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" height={44} width={96} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          <Skeleton variant="rounded" height={44} width={96} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          <Skeleton variant="rounded" height={44} width={96} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
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
      </Stack>
    </Box>
  );
}
