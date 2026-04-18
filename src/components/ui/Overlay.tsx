"use client";

import React from 'react';
import { 
  Box, 
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, DragHandle as DragHandleIcon } from '@mui/icons-material';
import { useOverlay } from './OverlayContext';

const Overlay: React.FC = () => {
  const { isOpen, content, closeOverlay } = useOverlay();

  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={closeOverlay}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
        BackdropProps: {
          sx: { bgcolor: 'rgba(0, 0, 0, 0.7)' },
        },
      }}
      PaperProps={{
        sx: {
          height: { xs: '94dvh', sm: '88dvh', md: '82dvh' },
          maxHeight: '100dvh',
          borderRadius: '28px 28px 0 0',
          bgcolor: '#0A0908',
          backgroundImage: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxShadow: '0 -24px 80px rgba(0, 0, 0, 0.65)',
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <DragHandleIcon sx={{ color: 'rgba(255,255,255,0.28)' }} />
            <Typography
              sx={{
                color: '#FFFFFF',
                fontWeight: 800,
                fontFamily: 'var(--font-satoshi)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Note Composer
            </Typography>
          </Stack>
          <IconButton
            onClick={closeOverlay}
            sx={{
              color: 'rgba(255,255,255,0.45)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.5, sm: 2.5 },
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 760 }}>
            {content}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Overlay;
