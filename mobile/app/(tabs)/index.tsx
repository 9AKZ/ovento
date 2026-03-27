import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface EventCardProps {
  event: any;
  onPress: () => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const tags = event.tags || [];
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.85}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.eventImage} resizeMode="cover" />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <MaterialCommunityIcons name="calendar" size={48} color="#A3A3A3" />
        </View>
      )}

      <View style={styles.badgesContainer}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{Number(event.price) === 0 ? 'Gratuit' : `€${event.price}`}</Text>
        </View>
        {event.status === 'DRAFT' && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftText}>Brouillon</Text>
          </View>
        )}
      </View>

      <View style={styles.eventContent}>
        <View style={styles.tagRow}>
          {tags.slice(0, 2).map((tag: string) => (
            <View key={tag} style={[styles.tagItem, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.tagItemText, { color: '#065f46' }]}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title || 'Titre de l’événement'}
        </Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description || 'Pas de description disponible'}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-month" size={14} color="#15803D" />
            <Text style={styles.metaText}>
              {event.startDatetime
                ? new Date(event.startDatetime).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Date inconnue'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#15803D" />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location || 'Lieu non défini'}
            </Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {event.currentParticipants ?? 0}/{event.capacity ?? 0} participants
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    event.capacity && event.capacity > 0
                      ? `${Math.min(((event.currentParticipants || 0) / event.capacity) * 100, 100)}%`
                      : '0%',
                },
              ]}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events = [], loading, error } = useEvents({ status: 'PUBLISHED' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'weekend'>('all');

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfWeekend = new Date(startOfWeek);
    endOfWeekend.setDate(startOfWeek.getDate() + 6);
    endOfWeekend.setHours(23, 59, 59, 999);

    return events.filter((event: any) => {
      const textMatch =
        event.title?.toLowerCase().includes(normalizedSearch) ||
        event.location?.toLowerCase().includes(normalizedSearch) ||
        event.description?.toLowerCase().includes(normalizedSearch);

      if (!textMatch) return false;

      if (!event.startDatetime || filter === 'all') return true;

      const eventDate = new Date(event.startDatetime);
      if (filter === 'today') return eventDate >= now && eventDate <= endOfDay;
      if (filter === 'week') return eventDate >= now && eventDate <= endOfWeek;
      if (filter === 'weekend') {
        const saturday = new Date(startOfWeek);
        saturday.setDate(startOfWeek.getDate() + 5);
        saturday.setHours(0, 0, 0, 0);

        const sunday = new Date(startOfWeek);
        sunday.setDate(startOfWeek.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return eventDate >= saturday && eventDate <= sunday;
      }
      return true;
    });
  }, [events, search, filter]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleCreateEvent = () => {
    router.push('/create');
  };

  const filters = [
    { value: 'all', label: 'Toutes' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'weekend', label: 'Week-end' },
  ];

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.errorText}>Erreur : {error}</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header />

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingTitle}>Bonjour, {user?.fullName ?? 'Invité'} 👋</Text>
              <Text style={styles.greetingSubtitle}>Trouvez l'événement parfait aujourd'hui</Text>
            </View>

            <View style={styles.searchSection}>
              <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher des événements..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.filterRow}>
              {filters.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterChip,
                    filter === item.value && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter(item.value as any)}
                >
                  <Text
                    style={
                      filter === item.value
                        ? styles.filterChipTextActive
                        : styles.filterChipText
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {user && (
              <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent} activeOpacity={0.8}>
                <Text style={styles.createButtonText}>Créer un événement</Text>
              </TouchableOpacity>
            )}
          </>
        }
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => handleEventPress(item.id)} />}
        ListEmptyComponent={
          <View style={styles.empty}> 
            <MaterialCommunityIcons name="calendar-blank" size={56} color="#CBD5E1" />
            <Text style={styles.emptyText}>Aucun événement trouvé.</Text>
            <Text style={styles.emptyDescription}>Essayez un autre filtre ou mot-clé.</Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, filteredEvents.length === 0 && styles.listContentFlex]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  searchSection: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#16A34A',
  },
  filterChipText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#16A34A',
    marginHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 0,
  },
  listContentFlex: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  eventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  priceBadge: {
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  priceText: {
    color: '#15803D',
    fontWeight: 'bold',
    fontSize: 12,
  },
  draftBadge: {
    backgroundColor: '#fde68a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  draftText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventContent: {
    padding: 14,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  tagItem: {
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagItemText: {
    color: '#4338ca',
    fontSize: 10,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#334155',
  },
  progressRow: {
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#15803D',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});
