import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';



export default function AuthTabsScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AUTH] Attempting login with:', { email });
      const result = await loginMutation.mutateAsync({ email, password });
      console.log('[AUTH] Login successful:', result.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error?.message || 'Erreur de connexion';
      console.error('[AUTH] Login error:', errorMessage, error);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AUTH] Attempting register with:', { fullName, email });
      const result = await registerMutation.mutateAsync({ fullName, email, password });
      console.log('[AUTH] Register successful:', result.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error?.message || 'Erreur d\'inscription';
      console.error('[AUTH] Register error:', errorMessage, error);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80&crop=entropy&cs=tinysrgb',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1000+</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>5000+</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>50+</Text>
          <Text style={styles.statLabel}>Villes</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.badgeContainer}>
          <MaterialCommunityIcons name="star" size={16} color="#16A34A" />
          <Text style={[styles.badgeText, { color: '#15803D' }]}>Bienvenue</Text>
        </View>
        <Text style={styles.title}>Explorez les Meilleurs Événements</Text>
        <Text style={styles.subtitle}>
          Connectez-vous avec des personnes passionnées et vivez des expériences inoubliables.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => {
            setActiveTab('login');
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
            Connexion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => {
            setActiveTab('register');
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
            Inscription
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {activeTab === 'login' ? (
          <>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="vous@exemple.com"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loginMutation.isPending}
                  keyboardType="email-address"
                  placeholderTextColor="#ccc"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loginMutation.isPending}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#ccc"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#16A34A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {loginMutation.error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{loginMutation.error.message}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, (loginMutation.isPending || isLoading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loginMutation.isPending || isLoading}
              activeOpacity={0.8}
            >
              {loginMutation.isPending || isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Se connecter</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!(registerMutation.isPending || isLoading)}
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="vous@exemple.com"
                  value={email}
                  onChangeText={setEmail}
                  editable={!(registerMutation.isPending || isLoading)}
                  keyboardType="email-address"
                  placeholderTextColor="#ccc"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  editable={!(registerMutation.isPending || isLoading)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#ccc"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#1D4ED8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!(registerMutation.isPending || isLoading)}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#ccc"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#1D4ED8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {registerMutation.error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{registerMutation.error.message}</Text>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.button, (registerMutation.isPending || isLoading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={registerMutation.isPending || isLoading}
              activeOpacity={0.8}
            >
              {registerMutation.isPending || isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Créer un compte</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  activeTabText: {
    color: '#16A34A',
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF5',
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    marginTop: 8,
    height: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
});
