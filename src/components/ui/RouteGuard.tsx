'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (isLoading) return;

    const publicRoute = isPublicRoute(pathname);
    
    if (!isAuthenticated && !publicRoute) {
      openIDMWindow();
      return;
    }

    if (isAuthenticated && pathname === '/') {
      router.replace('/notes');
    }
  }, [isLoading, isAuthenticated, pathname, router, openIDMWindow]);

  return <>{children}</>;
};
