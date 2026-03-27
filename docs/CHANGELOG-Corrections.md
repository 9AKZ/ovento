# 📋 Journal des Modifications - Corrections du Projet

Ce document liste toutes les corrections et améliorations apportées au projet NueveWorks.

---

## 🗓️ Date : 30 Janvier 2026

### 1. Suppression du Frontend Dupliqué

**Problème** : Deux frontends existaient dans le projet (`AdelFrontend` et `client`), créant de la confusion.

**Solution** : Le dossier `AdelFrontend` a été supprimé. Seul le dossier `client` est maintenant utilisé.

**Raison** : 
- `client` est plus complet (React Query, shadcn/ui, routing, validation)
- `AdelFrontend` était un prototype simple (tout dans un seul fichier)

---

### 2. Correction des Routes API Frontend

**Fichier modifié** : `client/shared/routes.ts`

**Problème** : Les routes `join` et `leave` ne correspondaient pas au backend.

**Avant** :
```typescript
join: {
  path: '/api/events/:id/join',  // ❌ N'existe pas dans le backend
}
leave: {
  path: '/api/events/:id/join',  // ❌ N'existe pas dans le backend
}
```

**Après** :
```typescript
join: {
  path: '/api/events/:id/inscriptions',  // ✅ Correspond au backend
}
leave: {
  path: '/api/inscriptions/:id',  // ✅ Correspond au backend
}
```

---

### 3. Suppression de Drizzle ORM (Inutile côté Frontend)

**Fichiers modifiés** : 
- `client/shared/schema.ts`
- `client/shared/routes.ts`

**Problème** : 
L'étudiant avait utilisé **Drizzle ORM** dans le frontend pour définir les schémas de données. Or, Drizzle est un ORM qui sert à :
- Se connecter à une base de données
- Exécuter des requêtes SQL
- Générer des migrations

**Cela n'a aucun sens côté frontend** car le frontend ne se connecte jamais directement à la base de données !

De plus, le **backend utilise Sequelize** (pas Drizzle), donc les schémas Drizzle ne correspondaient à rien.

**Avant** (`schema.ts`) :
```typescript
// ❌ Drizzle ORM - Inutile côté frontend
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  // ...
});

export const insertUserSchema = createInsertSchema(users);
```

**Après** (`schema.ts`) :
```typescript
// ✅ Zod pur - Simple et efficace
import { z } from "zod";

export const userSchema = z.object({
  id: z.string().or(z.number()),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["USER", "ORGANIZER", "ADMIN"]).default("USER"),
  // ...
});

export const insertUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

// Types inférés depuis Zod
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

**Avant** (`routes.ts`) :
```typescript
// ❌ Référence à Drizzle
import { users, events } from './schema';

responses: {
  200: z.object({
    user: z.custom<typeof users.$inferSelect>(),  // ❌ Syntaxe Drizzle
  }),
}
```

**Après** (`routes.ts`) :
```typescript
// ✅ Utilise les schémas Zod
import { userSchema, eventSchema } from './schema';

responses: {
  200: z.object({
    user: userSchema,  // ✅ Schéma Zod
  }),
}
```

---

## 📚 Comprendre la Différence

### Drizzle ORM vs Zod

| Outil | Utilisation | Où l'utiliser |
|-------|-------------|---------------|
| **Drizzle ORM** | Connexion BDD, requêtes SQL, migrations | Backend uniquement |
| **Sequelize** | Connexion BDD, requêtes SQL, migrations | Backend (utilisé dans ce projet) |
| **Zod** | Validation de données, typage TypeScript | Frontend ET Backend |

### Pourquoi Zod dans le Frontend ?

Zod sert à :
1. **Valider les formulaires** avant envoi au serveur
2. **Typer les réponses API** pour l'autocomplétion
3. **Documenter la structure des données** attendues

```typescript
// Exemple : Validation d'un formulaire avec Zod
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
});

// Utilisation avec react-hook-form
const form = useForm({
  resolver: zodResolver(loginSchema),
});
```

---

## 🔧 Fichiers Modifiés - Résumé

| Fichier | Action | Raison |
|---------|--------|--------|
| `AdelFrontend/` | Supprimé | Doublon inutile |
| `client/shared/schema.ts` | Réécrit | Remplacé Drizzle par Zod pur |
| `client/shared/routes.ts` | Corrigé | Aligné avec le backend + supprimé refs Drizzle |
| `client/src/hooks/use-events.ts` | Corrigé | Import des types depuis schema.ts |

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

```bash
cd client
npm install
npm run dev
```

Les erreurs TypeScript devraient avoir disparu.

---

## 📝 Leçons à Retenir

1. **Ne jamais mettre un ORM dans le frontend** - Les ORM sont pour le backend
2. **Utiliser Zod pour la validation** - Fonctionne partout (frontend + backend)
3. **Garder la cohérence** - Si le backend utilise Sequelize, pas besoin de Drizzle ailleurs
4. **Un seul frontend** - Éviter les doublons qui créent de la confusion
