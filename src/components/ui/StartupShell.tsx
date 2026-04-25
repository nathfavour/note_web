import { Box, Skeleton, Stack } from '@mui/material'

export function StartupShell() {
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
          bgcolor: 'rgba(10,9,8,0.96)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Box>
            <Skeleton variant="text" width={140} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" width={96} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        </Stack>
        <Skeleton variant="rounded" width={108} height={38} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
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
      </Box>
    </Box>
  )
}
