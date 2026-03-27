import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import api from '@/services/api';

interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  startDatetime: string;
  endDatetime?: string;
  capacity: number;
  currentParticipants: number;
  price: string | number;
  currency: string;
  status: string;
  imageUrl?: string;
  organizerId: string;
  organizer?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      {event.imageUrl && (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>📷</Text>
        </View>
      )}
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventLocation}>{event.location}</Text>
        <Text style={styles.eventDate}>
          {new Date(event.startDatetime).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={styles.eventPrice}>
          {event.price > 0 ? `${event.price}€` : 'Gratuit'}
        </Text>
        <Text style={styles.eventParticipants}>
          {event.currentParticipants}/{event.capacity} participants
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'myEvents' | 'joinedEvents'>('myEvents');

  const { data: myEvents, isLoading: myEventsLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const { data } = await api.get('/events/my-events');
      return data.events || [];
    },
    enabled: !!user,
  });

  const { data: joinedEvents, isLoading: joinedEventsLoading } = useQuery({
    queryKey: ['joined-events'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/inscriptions');
      return data.inscriptions?.map((i: any) => i.event) || [];
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Profil" />
        <View style={styles.center}>
          <Text style={styles.messageText}>Veuillez vous connecter</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const currentEvents = activeTab === 'myEvents' ? myEvents : joinedEvents;
  const isLoading = activeTab === 'myEvents' ? myEventsLoading : joinedEventsLoading;

  return (
    <ThemedView style={styles.container}>
      <Header title="Profil" />

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myEvents' && styles.activeTab]}
          onPress={() => setActiveTab('myEvents')}
        >
          <Text style={[styles.tabText, activeTab === 'myEvents' && styles.activeTabText]}>
            Mes Événements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joinedEvents' && styles.activeTab]}
          onPress={() => setActiveTab('joinedEvents')}
        >
          <Text style={[styles.tabText, activeTab === 'joinedEvents' && styles.activeTabText]}>
            Événements Rejoints
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={currentEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => handleEventPress(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {activeTab === 'myEvents'
                  ? 'Vous n\'avez créé aucun événement'
                  : 'Vous n\'avez rejoint aucun événement'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  messageText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 24,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  eventParticipants: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
