# 🎯 Instructions pour lancer l'app mobile iOS/Android

## ✅ Étape 1: Vérifier que tout est prêt

### Backend
```bash
# Vérifier que le backend tourne
curl http://localhost:4000/api/events
# Devrait retourner une liste d'événements (200 OK) ✅
```

### Frontend Web (optionnel - pour vérification)
- Devrait être sur http://localhost:8080
- Montre la liste des événements

## 📲 Étape 2: Lancer l'app mobile

### Terminal 1 - Expo (maintenant en cours!)
```bash
cd mobile
npm start
```

Vous verrez un QR code dans le terminal qui ressemble à:
```
Expo Go

█████████████████████████
█                       █
█  [Contenu du QR code] █
█                       █
█████████████████████████

iOS
  Press 'i' to open iOS simulator, or 's' to sign in

Android
  Press 'a' to open Android simulator

Web
  Press 'w' to open web version

Other
  Press 'j' for the inspector
  Press 'r' to reload
  Press 'e' to edit
  Press '.p' to stop
```

## 🔧 Étape 3: Configuration IMPORTANTE

### ⚠️ AVANT DE SCANNER LE QR CODE:

1. **Trouvez l'adresse IP de votre ordinateur:**
   
   **Windows:**
   ```bash
   ipconfig
   # Copiez l'IPv4 Address (ex: 192.168.X.X ou 10.0.X.X)
   ```
   
   **Mac/Linux:**
   ```bash
   ifconfig
   # Trouvez inet (ex: 192.168.X.X)
   ```

2. **Ouvrez le fichier:** `mobile/services/api.ts`

3. **Remplacez l'IP:**
   ```typescript
   // Cherchez cette ligne:
   const BACKEND_URL = 'http://192.168.1.100:4000'; // ← IP ANCIENNE
   
   // Remplacez par la VOTRE (ex):
   const BACKEND_URL = 'http://192.168.123.45:4000'; // ← VOTRE IP
   ```

4. **Sauvegardez** et l'app rechargera automatiquement! 🔄

## 📱 Étape 4: Scanner et lancer

### Sur iPhone:
```
1. Ouvrez l'app Appareil photo
2. Visez le QR code dans le terminal
3. Tapez la notification qui apparaît
4. L'app se lance dans Expo Go ✅
```

### Sur Android:
```
1. Ouvrez l'app Expo Go
2. Tapez l'icône QR code (bas de l'écran)
3. Scannez le QR code du terminal
4. L'app se lance ✅
```

## 🚀 Résultat attendu

Une fois l'app lancée, vous devriez voir:
- ✅ Liste de tous les événements
- ✅ Détails en cliquant sur un événement
- ✅ Bouton "Rejoindre" / "Se désinscrire"
- ✅ Informations en temps réel

## 🔄 Si HotReload ne fonctionne pas:

Appuyez sur 'r' dans le terminal pour recharger l'app, ou:
- iPhone: Secouez le téléphone
- Android: Tapez Menu → Reload

## ⚠️ Problèmes courants

**"Impossible de se connecter au serveur"**
- ❌ L'IP est incorrecte dans api.ts
- ❌ Le backend n'est pas lancé
- ❌ Téléphone et PC ne sont pas sur le même WiFi
- ✅ Solution: Vérifiez les points ci-dessus

**"Expo Go n'est pas installé"**
- iPhone: App Store → Expo Go
- Android: Google Play Store → Expo Go

**"QR code ne s'affiche pas dans le terminal"**
```bash
# Relancez avec:
cd mobile
npm start -- --reset-cache
```

## 📞 Support

Le projet comprend:
- **Backend**: Node.js Express http://localhost:4000
- **Frontend Web**: React Vite http://localhost:8080
- **Mobile**: React Native Expo (localhost:8083 par défaut)

Tous les trois peuvent tourner simultanément! 🎉

---

**Status:**
✅ Backend: Vérifiez http://localhost:4000
✅ Frontend Web: Vérifiez http://localhost:8080
✅ Mobile: QR code affiché dans terminal mobile
