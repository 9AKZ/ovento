# 📱 Ovento Mobile

Application mobile React Native pour Ovento utilisant Expo Go, permettant de consulter et gérer les événements en direct sur iOS et Android.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 16+ installé
- Expo Go installé sur votre iPhone ou Android
- Votre ordinateur et téléphone connectés au même réseau WiFi

### Installation

```bash
# Depuis le dossier mobile
cd mobile
npm install
```

### Lancement de l'app

```bash
# Démarrer le serveur Expo
npm start
```

Après que le serveur soit lancé, vous verrez un QR code dans le terminal.

## 📲 Connexion avec Expo Go

### Sur iPhone
1. Ouvrez l'app **Appareil photo**
2. Scannez le QR code affiché dans le terminal
3. Tapez le lien qui apparaît
4. L'app devrait se lancer automatiquement dans Expo Go

### Sur Android
1. Ouvrez l'app **Expo Go**
2. Tapez sur le code QR en bas
3. Scannez le QR code affiché dans le terminal
4. L'app devrait se lancer

## ⚙️ Configuration du Backend

Pour que l'app se connecte correctement à votre backend:

1. **Ouvrez** le fichier `services/api.ts`
2. **Remplacez** l'IP par l'IP de votre ordinateur:

```typescript
// Trouvez votre IP locale:
// Windows: ipconfig | findstr IPv4
// Mac/Linux: ifconfig | grep inet

const BACKEND_URL = 'http://192.168.X.X:4000'; // Remplacez X.X par votre IP
```

3. **Sauvegardez** et relancez l'app (`npm start`)

## 📱 Fonctionnalités

✅ **Consultation des événements**
- Liste complète de tous les événements
- Recherche par mots-clés
- Détails complets pour chaque événement

✅ **Gestion de la participation**
- Rejoindre un événement
- Quitter un événement
- Voir votre statut de participation

✅ **Informations détaillées**
- Date et heure
- Lieu
- Nombre de participants
- Capacité et taux de remplissage
- Organisateur
- Tags et description

## 📋 Structure du projet

```
mobile/
├── app/                    # Pages et navigation
│   ├── index.tsx          # Écran d'accueil (liste d'événements)
│   └── event/[id].tsx     # Détails d'un événement
├── services/
│   ├── api.ts            # Configuration Axios
│   └── eventService.ts   # Appels API
├── hooks/
│   └── useEvents.ts      # Hooks React personnalisés
├── app.json              # Configuration Expo
└── package.json          # Dépendances
```

## 🔄 Synchronisation avec le backend

L'app communique directement avec votre backend Express:

- **GET** `/api/events` - Liste des événements
- **GET** `/api/events/:id` - Détails d'un événement
- **POST** `/api/events/:id/inscriptions` - Rejoindre
- **DELETE** `/api/events/:id/inscriptions` - Quitter

## 🐛 Dépannage

### L'app ne se connecte pas au backend
- Vérifiez que le backend tourne sur le port 4000
- Vérifiez que l'IP dans `services/api.ts` est correcte
- Assurez-vous que votre téléphone et ordinateur sont sur le même réseau

### QR code ne s'affiche pas
- Utilisez `expo start -c` pour effacer le cache
- Relancez le serveur

### Erreur 403 ou 401
- Vous êtes probablement sur un écran public ne nécessitant pas d'authentification
- Les erreurs d'authentification sont normales au démarrage

## 🎯 Prochaines améliorations

- [ ] Authentification mobile
- [ ] Création d'événements depuis l'app
- [ ] Notifications push
- [ ] Favoris et sauvegarde locale
- [ ] Calendrier intégré

## 📝 Notes

- Les données sont actualisées en temps réel depuis le backend
- L'app utilise AsyncStorage pour le stockage local des tokens
- Le QR code met à jour les modifications de code en direct (Hot Reload)

---

**Besoin d'aide ?** Consultez la [documentation Expo](https://docs.expo.dev) ou la [documentation React Native](https://reactnative.dev)
