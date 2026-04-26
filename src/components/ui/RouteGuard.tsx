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
  const { isAuthReady, isAuthenticated, user, openIDMWindow } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // 1. Optimistic Redirect: If we have Pulse data and are on landing, go to /notes IMMEDIATELY
  useEffect(() => {
    if (user && user.isPulse && pathname === '/') {
        router.replace('/notes');
    }
  }, [user, pathname, router]);

  // 2. Finalized Redirect & Protection: Run once background revalidation is finished
  useEffect(() => {
    if (!isAuthReady) return;

    const publicRoute = isPublicRoute(pathname);
    
    // Protected route check: definitively unauthenticated
    if (!isAuthenticated && !publicRoute) {
      openIDMWindow();
      return;
    }

    // Landing to Notes redirect: definitively authenticated
    if (isAuthenticated && pathname === '/') {
      router.replace('/notes');
    }
  }, [isAuthReady, isAuthenticated, pathname, router, openIDMWindow]);

  return <>{children}</>;
};
