# 🎨 TP4 : Thème Beige/Bordeaux + Design Responsive

## Objectifs du TP

- ✅ Configurer une palette de couleurs personnalisée (beige/bordeaux)
- ✅ Créer des composants UI réutilisables
- ✅ Rendre l'application responsive (mobile, tablette, desktop)
- ✅ Améliorer l'expérience utilisateur

**Durée** : 2 heures | **Niveau** : ⭐⭐

---

## 📚 Prérequis

- Connaître les bases de CSS et TailwindCSS
- Avoir le projet frontend qui fonctionne

---

## 🎯 Partie 1 : Configuration de la Palette de Couleurs

### Étape 1.1 : Comprendre TailwindCSS

TailwindCSS est un framework CSS "utility-first". Au lieu d'écrire du CSS classique, on utilise des classes directement dans le HTML :

```html
<!-- CSS classique -->
<div style="background-color: #722f37; padding: 16px; border-radius: 8px;">
  Contenu
</div>

<!-- Avec TailwindCSS -->
<div class="bg-bordeaux-500 p-4 rounded-lg">
  Contenu
</div>
```

### Étape 1.2 : Ajouter les couleurs personnalisées

**Fichier à modifier** : `client/tailwind.config.ts`

Remplacez le contenu par :

```typescript
// client/tailwind.config.ts

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Palette de couleurs personnalisée
      colors: {
        // Couleurs Beige
        beige: {
          50: "#faf8f5",   // Très clair (fond de page)
          100: "#f5f0e8",  // Clair
          200: "#e8dfd0",  // Léger
          300: "#d4c4a8",  // Moyen
          400: "#c4a882",  // Soutenu
          500: "#b8956a",  // Principal
          600: "#9a7a52",  // Foncé
          700: "#7d6142",  // Très foncé
          800: "#614a33",  // Sombre
          900: "#4a3826",  // Très sombre
        },
        // Couleurs Bordeaux
        bordeaux: {
          50: "#fdf2f4",   // Très clair (hover léger)
          100: "#fce4e8",  // Clair
          200: "#f9ccd5",  // Léger
          300: "#f4a3b5",  // Moyen clair
          400: "#ec7a95",  // Moyen
          500: "#722f37",  // Principal (couleur de base)
          600: "#5c262d",  // Foncé
          700: "#4a1f25",  // Très foncé
          800: "#3d191e",  // Sombre
          900: "#2d1216",  // Très sombre
        },
        // Couleurs pour les états
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      // Polices personnalisées
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "serif"],
      },
      // Bordures arrondies
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      // Ombres personnalisées
      boxShadow: {
        soft: "0 2px 15px -3px rgba(114, 47, 55, 0.1), 0 4px 6px -4px rgba(114, 47, 55, 0.1)",
        card: "0 4px 20px -5px rgba(114, 47, 55, 0.15)",
        hover: "0 10px 40px -10px rgba(114, 47, 55, 0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### Étape 1.3 : Ajouter les polices Google

**Fichier à modifier** : `client/index.html`

Ajoutez dans le `<head>` :

```html
<!-- Polices Google -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

---

## 🎯 Partie 2 : Styles Globaux

### Étape 2.1 : Modifier les styles de base

**Fichier à modifier** : `client/src/index.css`

Remplacez le contenu par :

```css
/* client/src/index.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== STYLES DE BASE ===== */
@layer base {
  /* Corps de la page */
  body {
    @apply bg-beige-50 text-gray-800 font-sans antialiased;
  }

  /* Titres */
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading font-bold text-bordeaux-700;
  }

  h1 {
    @apply text-3xl md:text-4xl lg:text-5xl;
  }

  h2 {
    @apply text-2xl md:text-3xl;
  }

  h3 {
    @apply text-xl md:text-2xl;
  }

  /* Liens */
  a {
    @apply text-bordeaux-500 hover:text-bordeaux-600 transition-colors;
  }

  /* Focus visible pour l'accessibilité */
  *:focus-visible {
    @apply outline-none ring-2 ring-bordeaux-400 ring-offset-2;
  }
}

/* ===== COMPOSANTS RÉUTILISABLES ===== */
@layer components {
  /* Bouton principal */
  .btn-primary {
    @apply bg-bordeaux-500 text-white font-semibold py-3 px-6 rounded-lg
           hover:bg-bordeaux-600 active:bg-bordeaux-700
           transition-all duration-200 ease-in-out
           shadow-soft hover:shadow-hover
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* Bouton secondaire */
  .btn-secondary {
    @apply bg-beige-100 text-bordeaux-600 font-semibold py-3 px-6 rounded-lg
           border border-beige-300
           hover:bg-beige-200 active:bg-beige-300
           transition-all duration-200 ease-in-out;
  }

  /* Bouton outline */
  .btn-outline {
    @apply bg-transparent text-bordeaux-500 font-semibold py-3 px-6 rounded-lg
           border-2 border-bordeaux-500
           hover:bg-bordeaux-500 hover:text-white
           transition-all duration-200 ease-in-out;
  }

  /* Carte */
  .card {
    @apply bg-white rounded-xl border border-beige-200 shadow-card
           overflow-hidden transition-shadow duration-300
           hover:shadow-hover;
  }

  /* Input */
  .input-field {
    @apply w-full px-4 py-3 rounded-lg
           bg-beige-50 border border-beige-200
           text-gray-800 placeholder-gray-400
           focus:border-bordeaux-400 focus:ring-2 focus:ring-bordeaux-100
           transition-all duration-200;
  }

  /* Badge */
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full
           text-sm font-medium;
  }

  .badge-primary {
    @apply badge bg-bordeaux-100 text-bordeaux-700;
  }

  .badge-success {
    @apply badge bg-success-50 text-success-600;
  }

  .badge-warning {
    @apply badge bg-warning-50 text-warning-600;
  }

  /* Container responsive */
  .container-app {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  /* Grille responsive pour les cartes */
  .grid-cards {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
  }
}

/* ===== UTILITAIRES ===== */
@layer utilities {
  /* Texte tronqué sur plusieurs lignes */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Animation de fondu */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Gradient de fond */
  .bg-gradient-beige {
    @apply bg-gradient-to-br from-beige-50 via-white to-beige-100;
  }

  .bg-gradient-bordeaux {
    @apply bg-gradient-to-r from-bordeaux-500 to-bordeaux-600;
  }
}
```

---

## 🎯 Partie 3 : Composants Responsive

### Étape 3.1 : Créer un Header Responsive

**Fichier à créer** : `client/src/components/Header.tsx`

```tsx
// client/src/components/Header.tsx

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Plus, Home, Calendar, Settings } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navigation = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Événements", href: "/events", icon: Calendar },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white border-b border-beige-200 sticky top-0 z-50">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-bordeaux rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="font-heading text-xl text-bordeaux-600 hidden sm:block">
                NueveWorks
              </span>
            </a>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-bordeaux-50 text-bordeaux-600"
                      : "text-gray-600 hover:bg-beige-100"
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link href="/create">
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button className="btn-primary">Connexion</Button>
              </Link>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-beige-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-beige-200 animate-fade-in">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-bordeaux-50 text-bordeaux-600"
                        : "text-gray-600 hover:bg-beige-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              ))}

              {user ? (
                <>
                  <Link href="/dashboard">
                    <a
                      className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-beige-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      Mon espace
                    </a>
                  </Link>
                  <Link href="/create">
                    <a
                      className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-bordeaux-500 text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Créer un événement
                    </a>
                  </Link>
                </>
              ) : (
                <Link href="/auth">
                  <a
                    className="flex items-center px-4 py-3 rounded-lg text-sm font-medium bg-bordeaux-500 text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connexion
                  </a>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
```

### Étape 3.2 : Créer un Footer

**Fichier à créer** : `client/src/components/Footer.tsx`

```tsx
// client/src/components/Footer.tsx

import { Link } from "wouter";
import { Heart, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bordeaux-700 text-beige-100 mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-bordeaux-600 font-bold text-xl">E</span>
              </div>
              <span className="font-heading text-xl text-white">NueveWorks</span>
            </div>
            <p className="text-beige-200 text-sm leading-relaxed max-w-md">
              Découvrez et participez aux meilleurs événements près de chez vous.
              Créez vos propres événements et partagez-les avec la communauté.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-beige-200 hover:text-white transition-colors">
                    Accueil
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/events">
                  <a className="text-beige-200 hover:text-white transition-colors">
                    Événements
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/create">
                  <a className="text-beige-200 hover:text-white transition-colors">
                    Créer un événement
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@eventflow.fr"
                  className="flex items-center text-beige-200 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  contact@eventflow.fr
                </a>
              </li>
            </ul>
            {/* Réseaux sociaux */}
            <div className="flex space-x-4 mt-4">
              <a
                href="#"
                className="p-2 bg-bordeaux-600 rounded-lg hover:bg-bordeaux-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-bordeaux-600 rounded-lg hover:bg-bordeaux-500 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-bordeaux-600 mt-8 pt-8 text-center text-sm text-beige-300">
          <p className="flex items-center justify-center">
            © {currentYear} NueveWorks. Fait avec
            <Heart className="w-4 h-4 mx-1 text-red-400" />
            en France
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## 🎯 Partie 4 : Carte d'Événement Responsive

### Étape 4.1 : Créer le composant EventCard amélioré

**Fichier à créer** : `client/src/components/EventCard.tsx`

```tsx
// client/src/components/EventCard.tsx

import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, MapPin, Users, Euro, Clock } from "lucide-react";

type EventCardProps = {
  event: {
    id: number;
    title: string;
    description?: string;
    location: string;
    startDatetime: string;
    endDatetime?: string;
    capacity: number;
    price: string | number;
    imageUrl?: string;
    participantCount?: number;
    status?: string;
  };
};

export function EventCard({ event }: EventCardProps) {
  const isFree = Number(event.price) === 0;
  const spotsLeft = event.capacity - (event.participantCount || 0);
  const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
  const isFull = spotsLeft <= 0;

  return (
    <article className="card group">
      {/* Image */}
      <div className="relative h-48 sm:h-52 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-beige-200 to-beige-300 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-bordeaux-300" />
          </div>
        )}

        {/* Badge prix */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
              isFree
                ? "bg-success-500 text-white"
                : "bg-white text-bordeaux-600"
            }`}
          >
            {isFree ? "Gratuit" : `${event.price} €`}
          </span>
        </div>

        {/* Badge places restantes */}
        {(isAlmostFull || isFull) && (
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                isFull
                  ? "bg-error-500 text-white"
                  : "bg-warning-500 text-white"
              }`}
            >
              {isFull ? "Complet" : `${spotsLeft} places`}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5">
        {/* Titre */}
        <Link href={`/event/${event.id}`}>
          <h3 className="text-lg font-bold text-bordeaux-700 hover:text-bordeaux-500 cursor-pointer line-clamp-2 mb-3">
            {event.title}
          </h3>
        </Link>

        {/* Infos */}
        <div className="space-y-2 text-sm text-gray-600">
          {/* Date */}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-bordeaux-400 flex-shrink-0" />
            <span className="capitalize truncate">
              {format(new Date(event.startDatetime), "EEEE d MMMM", { locale: fr })}
            </span>
          </div>

          {/* Heure */}
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-bordeaux-400 flex-shrink-0" />
            <span>
              {format(new Date(event.startDatetime), "HH:mm", { locale: fr })}
              {event.endDatetime && (
                <> - {format(new Date(event.endDatetime), "HH:mm", { locale: fr })}</>
              )}
            </span>
          </div>

          {/* Lieu */}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-bordeaux-400 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Participants */}
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-bordeaux-400 flex-shrink-0" />
            <span>
              {event.participantCount || 0} / {event.capacity} participants
            </span>
          </div>
        </div>

        {/* Bouton */}
        <Link href={`/event/${event.id}`}>
          <button
            className={`w-full mt-4 py-2.5 rounded-lg font-semibold transition-all ${
              isFull
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "btn-primary"
            }`}
            disabled={isFull}
          >
            {isFull ? "Complet" : "Voir les détails"}
          </button>
        </Link>
      </div>
    </article>
  );
}
```

---

## 🎯 Partie 5 : Page d'Accueil Responsive

### Étape 5.1 : Créer le Hero Section

**Fichier à créer** : `client/src/components/HeroSection.tsx`

```tsx
// client/src/components/HeroSection.tsx

import { Link } from "wouter";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeroSectionProps = {
  onSearch?: (query: string) => void;
};

export function HeroSection({ onSearch }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-bordeaux-600 via-bordeaux-500 to-bordeaux-700 text-white overflow-hidden">
      {/* Motif décoratif */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container-app relative py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl mx-auto text-center">
          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Découvrez les meilleurs
            <span className="block text-beige-200">événements</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-beige-100 mb-8 max-w-2xl mx-auto">
            Trouvez des événements passionnants près de chez vous, 
            rencontrez de nouvelles personnes et créez des souvenirs inoubliables.
          </p>

          {/* Barre de recherche */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un événement..."
                className="pl-12 py-6 text-gray-800 bg-white border-0 shadow-lg"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
            <Button className="bg-beige-400 hover:bg-beige-500 text-bordeaux-800 font-semibold py-6 px-8">
              Rechercher
            </Button>
          </div>

          {/* CTA secondaire */}
          <Link href="/create">
            <a className="inline-flex items-center text-beige-200 hover:text-white font-medium transition-colors">
              Ou créez votre propre événement
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Link>
        </div>
      </div>

      {/* Vague décorative */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-beige-50"
          />
        </svg>
      </div>
    </section>
  );
}
```

---

## 🧪 Exercices Pratiques

### Exercice 1 : Mode Sombre

Ajoutez un bouton pour basculer entre le mode clair et le mode sombre.

**Indices** :
- Utilisez `useState` pour stocker le thème
- Ajoutez la classe `dark` sur `<html>`
- Définissez les couleurs dark dans `tailwind.config.ts`

### Exercice 2 : Skeleton Loading

Créez un composant `EventCardSkeleton` qui s'affiche pendant le chargement.

### Exercice 3 : Filtres Responsive

Créez un panneau de filtres qui :
- S'affiche en sidebar sur desktop
- S'affiche en modal/drawer sur mobile

---

## ✅ Checklist de Validation

- [ ] Les couleurs beige/bordeaux sont appliquées
- [ ] Le header est responsive (menu hamburger sur mobile)
- [ ] Les cartes s'adaptent à la taille de l'écran
- [ ] Le footer s'affiche correctement
- [ ] Les polices personnalisées sont chargées
- [ ] Les animations fonctionnent

---

**Passez au [TP5 : Système de Participation](./TP5-Participation-Evenements.md)**
