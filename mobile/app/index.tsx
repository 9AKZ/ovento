import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuthContext';
import { useEvents } from '../hooks/useEvents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const { events = [], loading: isLoading, error } = useEvents();
  const router = useRouter();

  React.useEffect(() => {
    if (!user && !authLoading) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  const filteredEvents = events.filter((event: any) =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', onPress: () => {}, style: 'cancel' },
      {
        text: 'Déconnecter',
        onPress: () => {
          logoutMutation.mutate();
          router.replace('/auth/index');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        style: 'destructive',
      },
    ]);
  };

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#d32f2f" />
        <Text style={styles.errorTitle}>Une erreur est survenue</Text>
        <Text style={styles.errorMessage}>Impossible de charger les événements</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            // Retry by refreshing
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DCFCE7" />
      
      <Header showMenu={true} onMenuPress={handleLogout} />

      {/* User Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>Bonjour, {user?.fullName || 'Utilisateur'}</Text>
        <Text style={styles.subgreeting}>Découvrez les meilleurs événements</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Search Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground} />
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <MaterialCommunityIcons name="star" size={20} color="#16A34A" />
              <Text style={styles.heroLabel}>Découvrez</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <MaterialCommunityIcons name="magnify" size={18} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher des événements..."
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>

            {/* Filter Options */}
            <View style={styles.filterRow}>
              {['all', 'today', 'week', 'weekend'].map((filterOption) => (
                <TouchableOpacity
                  key={filterOption}
                  style={[
                    styles.filterChip,
                    filter === filterOption && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setFilter(filterOption);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={
                      filterOption === 'all'
                        ? 'calendar-blank'
                        : filterOption === 'today'
                          ? 'calendar-today'
                          : filterOption === 'week'
                            ? 'calendar-week'
                            : 'calendar-check'
                    }
                    size={16}
                    color={filter === filterOption ? '#16A34A' : '#999'}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      filter === filterOption && styles.filterChipTextActive,
                    ]}
                  >
                    {filterOption === 'all'
                      ? 'Toutes'
                      : filterOption === 'today'
                        ? 'Aujourd\'hui'
                        : filterOption === 'week'
                          ? 'Cette semaine'
                          : 'Week-end'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Events Section */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Chargement des événements...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>Aucun événement trouvé</Text>
            <Text style={styles.emptyMessage}>
              Essayez d&apos;ajuster vos filtres ou revenir plus tard
            </Text>
          </View>
        ) : (
          <View style={styles.eventsGrid}>
            {filteredEvents.map((event: any, index: any) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => router.push(`/event/${event.id}`)}
                activeOpacity={0.8}
              >
                {/* Event Image */}
                <View style={styles.eventImageContainer}>
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={48}
                        color="#ddd"
                      />
                    </View>
                  )}

                  {/* Badges */}
                  <View style={styles.badgesContainer}>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>
                        {Number(event.price) === 0 ? 'Gratuit' : `€${event.price}`}
                      </Text>
                    </View>
                    {event.status === 'DRAFT' && (
                      <View style={styles.draftBadge}>
                        <Text style={styles.draftText}>Brouillon</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Event Content */}
                <View style={styles.eventContent}>
                  {/* Tags */}
                  <View style={styles.tagsContainer}>
                    {event.tags?.slice(0, 2).map((tag: any) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Title */}
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                  </Text>

                  {/* Description */}
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description || 'Pas de description disponible'}
                  </Text>

                  {/* Meta Information */}
                  <View style={styles.metaContainer}>
                    {/* Date */}
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={14}
                        color="#1D4ED8"
                      />
                      <Text style={styles.metaText}>
                        {new Date(event.startDatetime).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={14}
                        color="#1D4ED8"
                      />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                  </View>

                  {/* Participants Progress */}
                  <View style={styles.participantsContainer}>
                    <View style={styles.participantsInfo}>
                      <MaterialCommunityIcons
                        name="account-multiple"
                        size={14}
                        color="#1D4ED8"
                      />
                      <Text style={styles.participantsText}>
                        {event.currentParticipants ?? 0}/{event.capacity ?? 0} inscrits
                      </Text>
                    </View>
                    <Text style={styles.percentageText}>
                      {event.capacity && event.capacity > 0
                        ? Math.round(
                            ((event.currentParticipants ?? 0) / event.capacity) * 100
                          )
                        : 0}
                      %
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            event.capacity && event.capacity > 0
                              ? Math.min(
                                  100,
                                  ((event.currentParticipants ?? 0) / event.capacity) *
                                    100
                                )
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Event Button */}
      {user && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => Alert.alert('Créer un événement', 'Pas encore implémenté')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Créer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 12,
    color: '#999',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#065f46',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 12,
    color: '#999',
    maxWidth: '80%',
    textAlign: 'center',
  },
  eventsGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 4,
  },
  eventImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  draftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(200, 200, 200, 0.9)',
  },
  draftText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065f46',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  metaContainer: {
    gap: 10,
    marginVertical: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  participantsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  createButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
