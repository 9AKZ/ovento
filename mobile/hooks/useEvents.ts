import { useQuery } from '@tanstack/react-query';
import { eventService, Event } from '../services/eventService';

export function useEvents(filters?: Record<string, any>) {
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      try {
        const data = await eventService.getEvents(filters);
        return data;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to load events');
      }
    },
    retry: 1,
  });

  return {
    events: data || [],
    loading,
    error: error instanceof Error ? error.message : (error ? 'Failed to load events' : null),
    refetch,
  };
}

export function useEvent(id: string) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      try {
        const data = await eventService.getEvent(id);
        return data;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to load event');
      }
    },
    enabled: !!id,
    retry: 1,
  });

  return {
    event: data || null,
    loading,
    error: error instanceof Error ? error.message : (error ? 'Failed to load event' : null),
  };
}
