import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import api from '@/services/api';

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalInscriptions: number;
  publishedEvents: number;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface Event {
  id: string;
  title: string;
  status: string;
  organizer: {
    fullName: string;
  };
}

interface Inscription {
  id: string;
  user: {
    fullName: string;
  };
  event: {
    title: string;
  };
  status: string;
}

function StatCard({ title, value, color = '#007AFF' }: { title: string; value: number; color?: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{user.fullName}</Text>
      <Text style={styles.cardSubtitle}>{user.email}</Text>
      <Text style={styles.cardRole}>{user.role}</Text>
    </View>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{event.title}</Text>
      <Text style={styles.cardSubtitle}>Par {event.organizer.fullName}</Text>
      <Text style={[styles.cardStatus, event.status === 'PUBLISHED' ? styles.published : styles.draft]}>
        {event.status}
      </Text>
    </View>
  );
}

function InscriptionCard({ inscription }: { inscription: Inscription }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{inscription.event.title}</Text>
      <Text style={styles.cardSubtitle}>Par {inscription.user.fullName}</Text>
      <Text style={[styles.cardStatus, inscription.status === 'CONFIRMED' ? styles.confirmed : styles.pending]}>
        {inscription.status}
      </Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, eventsRes, inscriptionsRes] = await Promise.all([
        api.get('/admin/users?limit=1000'),
        api.get('/admin/events?limit=1000'),
        api.get('/admin/inscriptions?limit=1000'),
      ]);

      return {
        totalUsers: usersRes.data.total || 0,
        totalEvents: eventsRes.data.total || 0,
        totalInscriptions: inscriptionsRes.data.total || 0,
        publishedEvents: eventsRes.data.events?.filter((e: any) => e.status === 'PUBLISHED').length || 0,
      };
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users?limit=10');
      return data.users || [];
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data } = await api.get('/admin/events?limit=10');
      return data.events || [];
    },
  });

  const { data: inscriptions, isLoading: inscriptionsLoading } = useQuery({
    queryKey: ['admin-inscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/admin/inscriptions?limit=10');
      return data.inscriptions || [];
    },
  });

  if (statsLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Administration" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header title="Administration" />
      <ScrollView style={styles.scrollView}>
        {/* Stats */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Statistiques</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} color="#007AFF" />
            <StatCard title="Événements" value={stats?.totalEvents || 0} color="#34C759" />
            <StatCard title="Inscriptions" value={stats?.totalInscriptions || 0} color="#FF9500" />
            <StatCard title="Événements publiés" value={stats?.publishedEvents || 0} color="#AF52DE" />
          </View>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Utilisateurs récents</ThemedText>
          {usersLoading ? (
            <ActivityIndicator />
          ) : (
            users?.map((user: User) => <UserCard key={user.id} user={user} />)
          )}
        </View>

        {/* Events */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Événements récents</ThemedText>
          {eventsLoading ? (
            <ActivityIndicator />
          ) : (
            events?.map((event: Event) => <EventCard key={event.id} event={event} />)
          )}
        </View>

        {/* Inscriptions */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Inscriptions récentes</ThemedText>
          {inscriptionsLoading ? (
            <ActivityIndicator />
          ) : (
            inscriptions?.map((inscription: Inscription) => (
              <InscriptionCard key={inscription.id} inscription={inscription} />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  published: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  draft: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
  confirmed: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  pending: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
});