'use client';

import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/',
  '/signup',
  '/reset',
  '/verify'
];

const SHARED_NOTE_PATTERN = /^\/shared\/.+$/;

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(path) || SHARED_NOTE_PATTERN.test(path);
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { isLoading, isAuthenticated, openIDMWindow } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated && !publicRoute) {
      openIDMWindow();
      return;
    }

    if (isAuthenticated && pathname === '/') {
      router.replace('/notes');
    }
  }, [isLoading, isAuthenticated, pathname, router, openIDMWindow]);

  if (isLoading && !publicRoute) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at top, rgba(15,14,18,0.95), rgba(4,3,7,0.98))',
          color: '#fff',
        }}
      >
        <CircularProgress sx={{ color: '#6366F1' }} />
        <Typography sx={{ position: 'absolute', opacity: 0 }}>Loading</Typography>
      </Box>
    );
  }

  return <>{children}</>;
};
