'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/',
  '/landing',
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
    if (isLoading) {
      return;
    }

    const publicRoute = isPublicRoute(pathname);
    
    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && !publicRoute) {
      openIDMWindow();
      return;
    }

    // If user is authenticated and on landing page, redirect to notes
    if (isAuthenticated && pathname === '/') {
      // Use silent redirect without global loading
      router.replace('/notes');
      return;
    }

  }, [isLoading, isAuthenticated, pathname, router, openIDMWindow]);

  // For protected routes when user is not authenticated, stay on current page and show IDM window
  const publicRoute = isPublicRoute(pathname);
  if (!isAuthenticated && !publicRoute) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
