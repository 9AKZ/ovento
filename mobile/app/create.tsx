import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  DatePickerIOS,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';
import { eventService } from '../services/eventService';

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const handleCreateEvent = async () => {
    if (!title || !description || !location || !capacity) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[CREATE_EVENT] Submitting event:', {
        title,
        description,
        location,
        capacity: parseInt(capacity),
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
      });

      const eventData = {
        title,
        description,
        location,
        capacity: parseInt(capacity),
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
        price: 0,
        currency: 'EUR',
        status: 'DRAFT',
      };

      await eventService.createEvent(eventData);
      Alert.alert('Succès', 'Événement créé avec succès !');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      console.error('[CREATE_EVENT] Error:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer l\u2019événement');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Créer un événement" showBack={true} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Titre de l&apos;événement</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="format-title" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Ex: Concert achat-en-ligne"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#ccc"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez votre événement..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#ccc"
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
        </View>

        {/* Location Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Lieu</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Ex: Casablanca"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#ccc"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Capacity Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Nombre de places</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="people" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              value={capacity}
              onChangeText={setCapacity}
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de début</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDate(!showStartDate)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#22C55E" />
            <Text style={styles.dateButtonText}>
              {startDate.toLocaleDateString('fr-FR')} {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showStartDate && (
            <DatePickerIOS
              date={startDate}
              onDateChange={setStartDate}
              mode="datetime"
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDate(!showEndDate)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#22C55E" />
            <Text style={styles.dateButtonText}>
              {endDate.toLocaleDateString('fr-FR')} {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {showEndDate && (
            <DatePickerIOS
              date={endDate}
              onDateChange={setEndDate}
              mode="datetime"
            />
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer l&apos;événement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 120,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 12,
    marginLeft: 0,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    height: 52,
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
