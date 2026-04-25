import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/router-core'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Providers } from '@/components/Providers'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

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

function RootPendingComponent() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', color: '#fff', p: 3 }}>
      <Paper sx={{ p: 3, bgcolor: '#161412', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Opening workspace
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Loading the shell and starting your notes in the background.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}

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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            background: '#0A0908',
            color: '#fff',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(10,9,8,0.96)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: 140, height: 16, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ width: 96, height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
            <div style={{ width: 108, height: 38, borderRadius: 14, background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <div
              style={{
                width: 280,
                display: 'none',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                padding: 20,
              }}
            />
            <div style={{ flex: 1, padding: 24 }}>
              <div style={{ width: 180, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
              <div style={{ width: '100%', maxWidth: 960, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div style={{ height: 220, borderRadius: 24, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ height: 220, borderRadius: 24, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ height: 220, borderRadius: 24, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ height: 220, borderRadius: 24, background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
          </div>
        </div>
        <Providers>{children}</Providers>
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
