import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/router-core'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Providers } from '@/components/Providers'
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import AppLayoutShell from '@/components/AppLayoutShell'

import appCss from '../globals.css?url'

export const Route = createRootRoute({
  errorComponent: RootErrorComponent,
  pendingComponent: RootPendingComponent,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kylrix Note' },
      { name: 'description', content: 'Kylrix Note on TanStack Start.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fra.cloud.appwrite.io' },
      {
        rel: 'stylesheet',
        href: 'https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootErrorComponent({ error, info, reset }: ErrorComponentProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', p: 3 }}>
      <Paper sx={{ p: 3, bgcolor: '#161412', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            App error
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {error.message}
          </Typography>
          <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>
            {error.stack}
            {'\n'}
            {info?.componentStack}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={reset}>Retry</Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>Reload</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

function RootPendingComponent() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', color: 'white' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 88,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          bgcolor: 'rgba(10,9,8,0.92)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
          <Box>
            <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Skeleton variant="text" width={84} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        </Stack>
        <Skeleton variant="rounded" width={120} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
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
          <Skeleton variant="rounded" height={120} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }} />
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="rounded" height={72} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ServerShell />
        <Providers>
          <AppLayoutShell>{children}</AppLayoutShell>
        </Providers>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function ServerShell() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        minHeight: '100vh',
        bgcolor: '#0A0908',
        color: 'white',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: 88,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          bgcolor: 'rgba(10,9,8,0.92)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '14px',
              bgcolor: '#6366F1',
              boxShadow: '0 0 24px rgba(99,102,241,0.25)',
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
              NOTE
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
              Loading workspace
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Box sx={{ width: 96, height: 40, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
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
              <Box key={index} sx={{ height: 44, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.05)' }} />
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
          <Typography sx={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', mb: 1 }}>
            Notes
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', mb: 3 }}>
            Your workspace is warming up.
          </Typography>
          <Box sx={{ height: 120, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.04)', mb: 3 }} />
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Box key={index} sx={{ height: 72, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.04)' }} />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
