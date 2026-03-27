import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEvent } from '../../hooks/useEvents';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, loading, error } = useEvent(id || '');
  const { user } = useAuth();
  const router = useRouter();
  const [isJoining, setIsJoining] = React.useState(false);
  const [isActionPending, setIsActionPending] = React.useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = event?.isOwner || isAdmin;

  const handlePublish = async () => {
    if (!event) return;
    setIsActionPending(true);
    try {
      await eventService.publishEvent(event.id);
      Alert.alert('Succès', 'Événement publié');
      router.replace(`/event/${event.id}`);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUnpublish = async () => {
    if (!event) return;
    setIsActionPending(true);
    try {
      await eventService.unpublishEvent(event.id);
      Alert.alert('Succès', 'Événement remis en brouillon');
      router.replace(`/event/${event.id}`);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    setIsActionPending(true);
    try {
      await eventService.cancelEvent(event.id);
      Alert.alert('Succès', 'Événement annulé');
      router.replace(`/event/${event.id}`);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setIsActionPending(true);
    try {
      await eventService.deleteEvent(event.id);
      Alert.alert('Succès', 'Événement supprimé');
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      if (event?.isJoined) {
        await eventService.leaveEvent(event.id);
        Alert.alert('Succès', 'Vous avez quitté l\'événement');
      } else {
        await eventService.joinEvent(event?.id || '');
        Alert.alert('Succès', 'Vous êtes inscrit à l\'événement');
      }
      // Refresh event
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Événement non trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const capacity = event.capacity || 0;
  const participants = event.currentParticipants || 0;
  const percentage = capacity > 0 ? Math.round((participants / capacity) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={styles.headerImage} />
      )}

      <View style={styles.content}>
        {/* Price Badge */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {Number(event.price) === 0 ? 'Gratuit' : `€${event.price}`}
          </Text>
          {event.status === 'DRAFT' && (
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>Brouillon</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Key Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Heure</Text>
              <Text style={styles.infoValue}>
                {new Date(event.startDatetime).toLocaleDateString('fr-FR')}
              </Text>
              <Text style={styles.infoValue}>
                {new Date(event.startDatetime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Lieu</Text>
              <Text style={styles.infoValue}>{event.location}</Text>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#007AFF" />
              <Text style={styles.statLabel}>Inscrits</Text>
              <Text style={styles.statValue}>{participants}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="door-open" size={20} color="#34C759" />
              <Text style={styles.statLabel}>Capacité</Text>
              <Text style={styles.statValue}>{capacity}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Taux</Text>
              <Text style={styles.statValue}>{percentage}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%` }]} />
          </View>
          <Text style={styles.spotsText}>
            {capacity - participants > 0
              ? `${capacity - participants} place(s) restante(s)`
              : 'Événement complet'}
          </Text>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Organizer */}
        {event.organizer && (
          <View style={styles.organizerSection}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            <View style={styles.organizerCard}>
              {event.organizer.avatarUrl && (
                <Image
                  source={{ uri: event.organizer.avatarUrl }}
                  style={styles.organizerAvatar}
                />
              )}
              <Text style={styles.organizerName}>{event.organizer.fullName}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isManager ? (
          <>
            {event.status === 'DRAFT' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={handlePublish}
                disabled={isActionPending}
              >
                {isActionPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Publier</Text>}
              </TouchableOpacity>
            )}
            {event.status === 'PUBLISHED' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.leaveButton]}
                  onPress={handleUnpublish}
                  disabled={isActionPending}
                >
                  {isActionPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Mettre en brouillon</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.leaveButton]}
                  onPress={handleCancel}
                  disabled={isActionPending}
                >
                  {isActionPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Annuler</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleDelete}
              disabled={isActionPending}
            >
              {isActionPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Supprimer</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, event.isJoined ? styles.leaveButton : styles.joinButton]}
            onPress={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={event.isJoined ? 'logout' : 'plus-circle'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.actionButtonText}>
                  {event.isJoined ? 'Se désinscrire' : 'Rejoindre'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#E8E8E8',
  },
  content: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  draftBadge: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  draftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  participantsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  spotsText: {
    fontSize: 12,
    color: '#999',
  },
  descriptionSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  organizerSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  organizerCard: {
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8E8E8',
    marginBottom: 8,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#007AFF',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 12,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
