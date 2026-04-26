"use client";

import React from 'react';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSidebar } from '@/components/ui/SidebarContext';
import { useDynamicSidebar, DynamicSidebar } from '@/components/ui/DynamicSidebar';
import { DesktopSidebar, MobileBottomNav } from '@/components/Navigation';
import AppHeader from '@/components/AppHeader';
import { SidebarProvider } from '@/components/ui/SidebarContext';
import { DynamicSidebarProvider } from '@/components/ui/DynamicSidebar';

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DynamicSidebarProvider>
        <AppLayoutFrame>{children}</AppLayoutFrame>
      </DynamicSidebarProvider>
    </SidebarProvider>
  );
}

function AppLayoutFrame({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { isOpen: isDynamicSidebarOpen } = useDynamicSidebar();
  const pathname = usePathname();

  useEffect(() => {
    const mood = isDynamicSidebarOpen || pathname?.includes('/notes/') || pathname?.includes('/shared/')
      ? 'focus'
      : 'ambient';
    document.body.dataset.uiMood = mood;
    return () => {
      document.body.dataset.uiMood = 'ambient';
    };
  }, [isDynamicSidebarOpen, pathname]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
      <AppHeader />

      <Box sx={{ pt: '88px' }}>
        <DesktopSidebar />

        <Box
          component="main"
          sx={{
            minWidth: 0,
            pb: { xs: 12, md: 4 },
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            ml: {
              md: isCollapsed ? '80px' : '280px',
            },
            mr: isDynamicSidebarOpen ? { md: '28rem', lg: '32rem' } : 0,
          }}
        >
          <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, py: 3 }}>
            {children}
          </Box>
        </Box>
      </Box>

      <DynamicSidebar />
      <MobileBottomNav />
    </Box>
  );
}
