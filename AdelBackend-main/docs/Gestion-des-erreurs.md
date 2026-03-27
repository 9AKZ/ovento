# Gestion des erreurs et corrections — Documentation (FR) ✅

> Document destiné aux étudiants — explications des problèmes rencontrés, corrections appliquées, comment reproduire et tests recommandés.

---

## 🧭 Vue d'ensemble
- **Stack** : Node.js + Express, Sequelize (MySQL), Redis (ioredis), JWT, Winston, Vite + React (TypeScript).
- **Objectif** : centraliser les erreurs rencontrées en développement, expliquer les causes, détailler les corrections apportées et indiquer des bonnes pratiques et tests à effectuer.

---

## 🔍 Problèmes identifiés, causes et corrections (par issue)

### 1) imageUrl === null → Échec de validation côté client (Zod)
- **Symptôme** : le client (Zod) levait `Expected string, received null` lors de la validation d'un tableau d'événements.
- **Cause** : l'API retournait explicitement `imageUrl: null` pour certains événements.
- **Correction appliquée** :
  - Normalisation dans `Event.toPublicJSON()` : utiliser `this.image_url ?? undefined` pour éviter `null`.
  - Sanitation dans `src/services/EventService.js` (liste) : supprimer la clé `imageUrl` si sa valeur est `null` et assurer `tags` comme tableau.
- **Fichiers** : `src/models/Event.js`, `src/services/EventService.js`.

### 2) Cache HTTP provoquant des 304 Not Modified
- **Symptôme** : le client recevait `304` et n’affichait pas les derniers changements.
- **Cause** : cache côté serveur et absence d’instructions explicites côté client.
- **Correction appliquée** :
  - Ajout de `res.set('Cache-Control', 'no-store')` sur les routes d’événements.
  - Côté client : `fetch(..., { cache: 'no-store' })` pour forcer récupération.
- **Fichiers** : `src/controllers/EventController.js`, `client/src/hooks/use-events.ts`.

### 3) Mot de passe DB hardcodé / dotenv non fiable
- **Symptôme** : valeur de mot de passe dans le code source / problèmes de chargement de `.env` dans des scripts.
- **Cause** : variable directe dans `db.js` et import/dotenv parfois manquant.
- **Correction appliquée** :
  - Lire `DB_PASS` via `process.env` et charger explicitement `.env` pour les scripts.
  - En production : fail-fast si `DB_PASS` manquant.
- **Fichier** : `src/config/db.js`.

### 4) Utilisation de `KEYS` Redis (scalabilité)
- **Symptôme** : commandes `KEYS` qui peuvent bloquer Redis en production.
- **Correction appliquée** : utiliser `scanStream` pour itérer/supprimer les clés.
- **Fichier** : `src/config/redis.js`.

### 5) Logging — dossier `logs` manquant
- **Symptôme** : Winston échoue si le dossier `logs` n’existe pas.
- **Correction appliquée** : création automatique du dossier au démarrage.
- **Fichier** : `src/config/logger.js`.

### 6) Seed script non idempotent / pas de protections
- **Symptôme** : seed pouvant insérer doublons et pas de protection en prod.
- **Correction appliquée** : idempotence via `findOrCreate`, options CLI (`--force`) et protection (`--force` requis en production).
- **Fichier** : `src/scripts/seed.js`.

### 7) Auth — cookies + header fallback
- **Amélioration** :
  - Serveur : émet `accessToken`/`refreshToken` en cookies HttpOnly **et** retourne les tokens en corps de réponse pour SPA.
  - Middleware : accepte tokens depuis `Authorization: Bearer` OU cookies.
  - `/api/auth/me` : `optionalAuth` retourne `user: null` si non authentifié (au lieu d’un 401). 
- **Fichiers** : `src/controllers/AuthController.js`, `src/middlewares/auth.middleware.js`.

---

## ▶️ Comment reproduire & vérifier localement

- Lister événements et vérifier l'absence de `imageUrl: null` :

```bash
curl -sS http://localhost:4000/api/events | jq '.events[] | {id, imageUrl}'
# ou
node -e "(async()=>{const r=await fetch('http://localhost:4000/api/events');console.log(await r.text())})()"
```

- Vérifier en-tête `Cache-Control` :

```bash
curl -I http://localhost:4000/api/events
```

- Tester login/cookie :

```bash
curl -i -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"..."}'
# vérifier Set-Cookie
```

- Lancer le seed :

```bash
npm run seed
```

- Si le port est occupé (EADDRINUSE) :

```powershell
netstat -ano | findstr :4000
# puis taskkill /PID <pid> /F
```

---

## ✅ Tests recommandés (Jest + Supertest)

- **Test : `/api/events` ne doit pas retourner `imageUrl: null`**

```javascript
import request from 'supertest';
import app from '../src/server.js';

test('GET /api/events: pas de imageUrl null', async () => {
  const res = await request(app).get('/api/events').expect(200);
  const events = res.body.events;
  for (const e of events) {
    expect(e.imageUrl).not.toBe(null);
  }
});
```

- **Test : auth par cookie**
  - POST `/api/auth/login` → doit renvoyer `Set-Cookie`.
  - GET `/api/auth/me` avec cookie → doit renvoyer l'utilisateur authentifié.

Souhaitez-vous que j'ajoute ces tests au projet automatiquement ?

---

## ⚠️ Recommandations & bonnes pratiques
- Ne jamais committer `.env` (ajouter à `.gitignore`).
- En production : `SameSite=None; Secure` pour cookies si le client est cross-site (et HTTPS requis).
- Monitorer Redis / MySQL et éviter `KEYS` en prod.
- Ajouter des checks automatiques en CI pour l’envoi de `Set-Cookie` et formats d’API.

---

## 📁 Fichiers modifiés (résumé)
- `src/config/db.js` — lecture/validation `DB_PASS`
- `src/config/logger.js` — création du dossier `logs`
- `src/config/redis.js` — utilisation de `scanStream`
- `src/scripts/seed.js` — idempotence et options CLI
- `src/controllers/AuthController.js` — cookies + body tokens
- `src/middlewares/auth.middleware.js` — support cookie / header
- `src/services/EventService.js` — sanitation des événements
- `src/models/Event.js` — `toPublicJSON` normalisation
- `client/src/hooks/use-events.ts` — `cache: 'no-store'` côté client

---

## 🛠️ Suivi et prochaines actions possibles
- Ajouter les tests Jest/Supertest ci-dessus ✅
- Ajouter un test d’intégration pour le seed (vérifier que les entités sont créées sans doublons). ✅
- Documenter la politique cookies et le plan de déploiement sécurisé. ✅

---

> Si vous voulez, je peux :
> - Ajouter les tests dans `__tests__` et les lancer localement, ou
> - Générer une version PDF / imprimable de ce document.

Dites-moi la suite souhaitée : ajouter les tests ou générer la version imprimable ? ✍️
