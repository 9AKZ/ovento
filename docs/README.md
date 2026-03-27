# 📚 Documentation Projet NueveWorks - OneLastEvent

## Guide Complet pour Étudiants Débutants

Bienvenue dans ce guide de développement ! Ce document vous accompagnera pas à pas dans la compréhension et l'amélioration de l'application **NueveWorks** - une plateforme de gestion d'événements.

---

## 📋 Table des Matières

1. [Présentation du Projet](#-présentation-du-projet)
2. [Architecture Technique](#-architecture-technique)
3. [Installation et Configuration](#-installation-et-configuration)
4. [Structure des Dossiers](#-structure-des-dossiers)
5. [Les TPs Disponibles](#-les-tps-disponibles)

---

## 🎯 Présentation du Projet

**NueveWorks** est une application web de gestion d'événements qui permet :
- Aux **utilisateurs** de s'inscrire, se connecter, et participer à des événements
- Aux **organisateurs** de créer et gérer leurs événements
- Aux **administrateurs** de superviser l'ensemble de la plateforme

### Technologies Utilisées

| Côté | Technologies |
|------|-------------|
| **Backend** | Node.js, Express.js, Sequelize (ORM), MySQL, Redis, JWT |
| **Frontend** | React 18, Vite, TailwindCSS, shadcn/ui, React Query |
| **Temps réel** | Socket.io |
| **Paiements** | Stripe (optionnel) |

---

## 🏗 Architecture Technique

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   FRONTEND      │────▶│    BACKEND      │────▶│   BASE DE       │
│   (React)       │     │    (Express)    │     │   DONNÉES       │
│   Port: 8080    │     │    Port: 4000   │     │   (MySQL)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     REDIS       │
                        │   (Cache/JWT)   │
                        └─────────────────┘
```

### Modèle MVC du Backend

```
Backend/
├── Controllers/  → Reçoit les requêtes HTTP, appelle les services
├── Services/     → Logique métier
├── Repositories/ → Accès aux données
├── Models/       → Définition des tables (Sequelize)
├── Middlewares/  → Authentification, validation, etc.
├── Routes/       → Définition des endpoints API
└── Validators/   → Schémas de validation (Joi)
```

---

## ⚙ Installation et Configuration

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (version 18 ou supérieure) : [nodejs.org](https://nodejs.org)
- **MySQL** (version 8) : [mysql.com](https://mysql.com)
- **Redis** : [redis.io](https://redis.io) (ou utilisez Docker)
- **Git** : [git-scm.com](https://git-scm.com)
- **VS Code** : [code.visualstudio.com](https://code.visualstudio.com)

### Étape 1 : Cloner le projet

```bash
git clone <url-du-repo>
cd Projet-Final-SLAM-2-main
```

### Étape 2 : Configurer le Backend

```bash
# Aller dans le dossier backend
cd AdelBackend-main

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp env.example .env
```

**Modifier le fichier `.env`** avec vos informations :

```env
# Application
NODE_ENV=development
PORT=4000

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=votre_mot_de_passe
DB_NAME=onelastevent_db

# JWT (Sécurité - IMPORTANT : changez ces valeurs !)
JWT_ACCESS_SECRET=votre_secret_access_tres_long_et_complexe_32_caracteres
JWT_REFRESH_SECRET=votre_secret_refresh_tres_long_et_complexe_32_caracteres
JWT_ACCESS_EXP=15m
JWT_REFRESH_EXP=30d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Étape 3 : Créer la base de données

```sql
-- Dans MySQL Workbench ou terminal MySQL
CREATE DATABASE onelastevent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Étape 4 : Lancer le Backend

```bash
# Dans le dossier AdelBackend-main
npm run dev
```

Vous devriez voir :
```
✅ Database connection established successfully.
✅ Database synchronized successfully.
🚀 Server running on http://0.0.0.0:4000
```

### Étape 5 : Configurer le Frontend

```bash
# Ouvrir un nouveau terminal
cd client

# Installer les dépendances
npm install

# Lancer le frontend
npm run dev
```

Le frontend sera accessible sur : **http://localhost:8080**

---

## 📁 Structure des Dossiers

### Backend (`AdelBackend-main/src/`)

```
src/
├── config/
│   ├── db.js           # Configuration MySQL/Sequelize
│   ├── redis.js        # Configuration Redis
│   └── logger.js       # Configuration des logs
│
├── controllers/
│   ├── AuthController.js      # Login, Register, Logout
│   ├── EventController.js     # CRUD Événements
│   ├── InscriptionController.js
│   ├── PaymentController.js
│   └── UserController.js
│
├── middlewares/
│   ├── auth.middleware.js     # Vérification JWT
│   ├── role.middleware.js     # Vérification des rôles
│   ├── validate.middleware.js # Validation des données
│   ├── rateLimiter.middleware.js
│   └── upload.middleware.js   # Upload d'images
│
├── models/
│   ├── User.js         # Modèle Utilisateur
│   ├── Event.js        # Modèle Événement
│   ├── Inscription.js  # Modèle Inscription
│   ├── Payment.js      # Modèle Paiement
│   └── index.js        # Associations entre modèles
│
├── routes/
│   ├── auth.routes.js
│   ├── events.routes.js
│   ├── users.routes.js
│   └── index.js        # Point d'entrée des routes
│
├── services/
│   ├── AuthService.js
│   ├── EventService.js
│   └── PaymentService.js
│
├── validators/
│   ├── auth.validator.js
│   └── event.validator.js
│
└── server.js           # Point d'entrée de l'application
```

### Frontend (`client/src/`)

```
src/
├── components/
│   ├── layout.tsx      # Layout principal (navbar, footer)
│   └── ui/             # Composants shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/
│   ├── use-auth.tsx    # Hook d'authentification
│   ├── use-events.ts   # Hook pour les événements
│   └── use-toast.ts    # Hook pour les notifications
│
├── pages/
│   ├── auth-page.tsx       # Page de connexion/inscription
│   ├── home-page.tsx       # Page d'accueil
│   ├── create-event-page.tsx
│   ├── event-details-page.tsx
│   └── profile-page.tsx
│
├── lib/
│   └── queryClient.ts  # Configuration React Query
│
├── App.tsx             # Composant racine + routing
├── main.tsx            # Point d'entrée
└── index.css           # Styles globaux
```

---

## 📝 Les TPs Disponibles

Chaque TP est conçu pour être réalisé en **2 à 4 heures** et vous guidera pas à pas.

| TP | Titre | Difficulté | Durée |
|----|-------|------------|-------|
| [TP1](./TP1-CRUD-Evenements.md) | Gestion des Événements (CRUD) | ⭐⭐ | 3h |
| [TP2](./TP2-Dashboard-Admin.md) | Tableau de Bord Admin | ⭐⭐⭐ | 4h |
| [TP3](./TP3-Dashboard-User.md) | Tableau de Bord Utilisateur | ⭐⭐ | 3h |
| [TP4](./TP4-Theme-Responsive.md) | Thème Beige/Bordeaux + Responsive | ⭐⭐ | 2h |
| [TP5](./TP5-Participation-Evenements.md) | Système de Participation | ⭐⭐⭐ | 4h |

### Ordre Recommandé

1. **TP4** (Thème) - Pour avoir une belle interface dès le départ
2. **TP1** (CRUD) - Comprendre les bases
3. **TP5** (Participation) - Ajouter l'interactivité
4. **TP3** (Dashboard User) - Interface utilisateur
5. **TP2** (Dashboard Admin) - Interface admin

---

## 🎨 Palette de Couleurs du Projet

Pour les TPs, nous utiliserons cette palette **beige et bordeaux** :

```css
/* Couleurs principales */
--beige-50: #faf8f5;
--beige-100: #f5f0e8;
--beige-200: #e8dfd0;
--beige-300: #d4c4a8;
--beige-400: #c4a882;

--bordeaux-50: #fdf2f4;
--bordeaux-100: #fce4e8;
--bordeaux-200: #f9ccd5;
--bordeaux-300: #f4a3b5;
--bordeaux-400: #ec7a95;
--bordeaux-500: #722f37;  /* Couleur principale */
--bordeaux-600: #5c262d;
--bordeaux-700: #4a1f25;
--bordeaux-800: #3d191e;
--bordeaux-900: #2d1216;
```

---

## 🆘 Besoin d'Aide ?

- **Erreur de connexion à la base de données** : Vérifiez vos identifiants dans `.env`
- **Port déjà utilisé** : Changez le port dans `.env` ou arrêtez l'autre processus
- **Erreur CORS** : Vérifiez que le backend tourne sur le port 4000

---

**Bonne chance et bon apprentissage ! 🚀**
