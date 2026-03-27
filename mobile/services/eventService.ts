import api from './api';

export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  startDatetime: string;
  endDatetime?: string;
  capacity: number;
  currentParticipants: number;
  participantCount?: number;
  price: string | number;
  currency: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  imageUrl?: string;
  organizerId: string;
  isOwner?: boolean;
  isJoined?: boolean;
  organizer?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export const eventService = {
  async getEvents(filters?: Record<string, any>): Promise<Event[]> {
    const { data } = await api.get('/events', { params: filters });
    return data.events || data;
  },

  async getEvent(id: string): Promise<Event> {
    const { data } = await api.get(`/events/${id}`);
    return data.event || data;
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const { data } = await api.post('/events', eventData);
    return data.event;
  },

  async joinEvent(id: string): Promise<void> {
    await api.post(`/events/${id}/inscriptions`);
  },

  async leaveEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}/inscriptions`);
  },

  async publishEvent(id: string): Promise<void> {
    await api.post(`/events/${id}/publish`);
  },

  async unpublishEvent(id: string): Promise<void> {
    await api.post(`/events/${id}/unpublish`);
  },

  async cancelEvent(id: string): Promise<void> {
    await api.post(`/events/${id}/cancel`);
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },
};
