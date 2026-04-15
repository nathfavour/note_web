'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemText, 
  CircularProgress, 
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  Event as EventIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { Modal } from './modal';
import { listFlowEvents } from '@/lib/appwrite';
import { useToast } from './Toast';

interface Event {
  $id: string;
  title: string;
  startTime: string;
  location: string;
}

interface EventSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (eventId: string) => void;
}

export function EventSelectorModal({ isOpen, onClose, onSelect }: EventSelectorModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchEvents = async () => {
        setLoading(true);
        try {
          const res = await listFlowEvents();
          setEvents(res.documents as any[]);
        } catch (err: any) {
          showError(err.message || 'Failed to fetch events from Kylrix Flow');
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }
  }, [isOpen, showError, onClose]);

  const filteredEvents = events.filter(event => 
    (event.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (event.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attach Event">
      <Box sx={{ minHeight: '300px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search events..."
          value={search}
          onChange={ (e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#6366F1' },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={32} sx={{ color: '#6366F1' }} />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.5 }}>
            <EventIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">No events found</Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            {filteredEvents.map((event) => (
              <ListItemButton
                key={event.$id}
                onClick={() => onSelect(event.$id)}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.05)',
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', color: 'rgba(99, 102, 241, 0.6)' }}>
                  <EventIcon fontSize="small" />
                </Box>
                <ListItemText 
                  primary={event.title} 
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <TimeIcon sx={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.3)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  }
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)'
                  }} 
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
}
