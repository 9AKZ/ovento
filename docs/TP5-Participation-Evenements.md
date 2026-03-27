# 🎫 TP5 : Système de Participation aux Événements

## Objectifs du TP

- ✅ Comprendre le flux d'inscription à un événement
- ✅ Créer la page de détails d'un événement
- ✅ Implémenter le bouton "Participer" / "Se désinscrire"
- ✅ Afficher la liste des participants
- ✅ Gérer les places disponibles

**Durée** : 4 heures | **Niveau** : ⭐⭐⭐

---

## 📚 Prérequis

- Avoir terminé les TP1 à TP4
- Comprendre les hooks React (useState, useEffect)
- Comprendre React Query (useQuery, useMutation)

---

## 🎯 Partie 1 : Comprendre le Backend

### 1.1 Les Routes d'Inscription

Ouvrez `AdelBackend-main/src/routes/inscriptions.routes.js` et observez :

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/events/:id/inscriptions` | S'inscrire à un événement |
| DELETE | `/api/inscriptions/:id` | Se désinscrire |
| GET | `/api/events/:id/inscriptions` | Liste des inscrits |
| GET | `/api/inscriptions/me` | Mes inscriptions |

### 1.2 Le Modèle Inscription

```javascript
// Structure d'une inscription
{
  id: UUID,
  user_id: UUID,        // L'utilisateur inscrit
  event_id: UUID,       // L'événement
  status: ENUM,         // PENDING, CONFIRMED, CANCELLED
  payment_status: ENUM, // PENDING, PAID, REFUNDED
  created_at: Date,
  updated_at: Date
}
```

---

## 🎯 Partie 2 : Créer le Hook de Participation

### Étape 2.1 : Hook useEventParticipation

**Fichier à créer** : `client/src/hooks/use-participation.ts`

```typescript
// client/src/hooks/use-participation.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types
type Participant = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
};

type ParticipationStatus = {
  isParticipating: boolean;
  inscriptionId?: string;
  status?: string;
};

// Hook pour vérifier si l'utilisateur participe
export function useParticipationStatus(eventId: number) {
  return useQuery({
    queryKey: ["participation", "status", eventId],
    queryFn: async (): Promise<ParticipationStatus> => {
      const res = await fetch(`/api/events/${eventId}/inscriptions/me`, {
        credentials: "include",
      });
      
      if (res.status === 404) {
        return { isParticipating: false };
      }
      
      if (!res.ok) {
        throw new Error("Erreur lors de la vérification");
      }
      
      const data = await res.json();
      return {
        isParticipating: true,
        inscriptionId: data.inscription?.id,
        status: data.inscription?.status,
      };
    },
    retry: false,
  });
}

// Hook pour récupérer la liste des participants
export function useEventParticipants(eventId: number) {
  return useQuery({
    queryKey: ["event", eventId, "participants"],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/inscriptions`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des participants");
      }
      
      return res.json();
    },
  });
}

// Hook pour s'inscrire à un événement
export function useJoinEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const res = await fetch(`/api/events/${eventId}/inscriptions`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Impossible de s'inscrire");
      }

      return res.json();
    },
    onSuccess: (_, eventId) => {
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["participation", "status", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "Inscription réussie ! 🎉",
        description: "Vous participez maintenant à cet événement",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook pour se désinscrire d'un événement
export function useLeaveEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, inscriptionId }: { eventId: number; inscriptionId: string }) => {
      const res = await fetch(`/api/inscriptions/${inscriptionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Impossible de se désinscrire");
      }

      return res.json();
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["participation", "status", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "Désinscription confirmée",
        description: "Vous ne participez plus à cet événement",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
```

---

## 🎯 Partie 3 : Bouton de Participation

### Étape 3.1 : Créer le composant ParticipateButton

**Fichier à créer** : `client/src/components/ParticipateButton.tsx`

```tsx
// client/src/components/ParticipateButton.tsx

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useParticipationStatus,
  useJoinEvent,
  useLeaveEvent,
} from "@/hooks/use-participation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, UserPlus, UserMinus, Check, LogIn } from "lucide-react";
import { Link } from "wouter";

type ParticipateButtonProps = {
  eventId: number;
  isFull?: boolean;
  isPast?: boolean;
  className?: string;
};

export function ParticipateButton({
  eventId,
  isFull = false,
  isPast = false,
  className = "",
}: ParticipateButtonProps) {
  const { user } = useAuth();
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Vérifier le statut de participation
  const { data: status, isLoading: statusLoading } = useParticipationStatus(eventId);

  // Mutations
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();

  const isLoading = statusLoading || joinMutation.isPending || leaveMutation.isPending;

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <Link href="/auth">
        <Button className={`btn-primary ${className}`}>
          <LogIn className="w-4 h-4 mr-2" />
          Connectez-vous pour participer
        </Button>
      </Link>
    );
  }

  // Si l'événement est passé
  if (isPast) {
    return (
      <Button disabled className={`bg-gray-300 text-gray-500 ${className}`}>
        Événement terminé
      </Button>
    );
  }

  // Si l'utilisateur participe déjà
  if (status?.isParticipating) {
    return (
      <>
        <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
          {/* Badge de confirmation */}
          <div className="flex items-center justify-center px-4 py-2 bg-success-50 text-success-600 rounded-lg font-medium">
            <Check className="w-5 h-5 mr-2" />
            Vous participez
          </div>

          {/* Bouton de désinscription */}
          <Button
            variant="outline"
            onClick={() => setShowConfirmLeave(true)}
            disabled={isLoading}
            className="border-error-500 text-error-500 hover:bg-error-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserMinus className="w-4 h-4 mr-2" />
                Se désinscrire
              </>
            )}
          </Button>
        </div>

        {/* Dialog de confirmation */}
        <AlertDialog open={showConfirmLeave} onOpenChange={setShowConfirmLeave}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Se désinscrire ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir vous désinscrire de cet événement ?
                Vous pourrez vous réinscrire plus tard si des places sont disponibles.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (status.inscriptionId) {
                    leaveMutation.mutate({
                      eventId,
                      inscriptionId: status.inscriptionId,
                    });
                  }
                  setShowConfirmLeave(false);
                }}
                className="bg-error-500 hover:bg-error-600"
              >
                Se désinscrire
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Si l'événement est complet
  if (isFull) {
    return (
      <Button disabled className={`bg-gray-300 text-gray-500 ${className}`}>
        Complet - Plus de places disponibles
      </Button>
    );
  }

  // Bouton pour s'inscrire
  return (
    <Button
      onClick={() => joinMutation.mutate(eventId)}
      disabled={isLoading}
      className={`btn-primary ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      Participer à cet événement
    </Button>
  );
}
```

---

## 🎯 Partie 4 : Liste des Participants

### Étape 4.1 : Créer le composant ParticipantsList

**Fichier à créer** : `client/src/components/ParticipantsList.tsx`

```tsx
// client/src/components/ParticipantsList.tsx

import { useEventParticipants } from "@/hooks/use-participation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ParticipantsListProps = {
  eventId: number;
  capacity: number;
};

export function ParticipantsList({ eventId, capacity }: ParticipantsListProps) {
  const { data, isLoading, error } = useEventParticipants(eventId);

  if (isLoading) {
    return (
      <Card className="border-beige-200">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-bordeaux-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-beige-200">
        <CardContent className="text-center py-8 text-gray-500">
          Impossible de charger les participants
        </CardContent>
      </Card>
    );
  }

  const participants = data?.inscriptions || [];
  const participantCount = participants.length;
  const spotsLeft = capacity - participantCount;

  return (
    <Card className="border-beige-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Users className="w-5 h-5 mr-2 text-bordeaux-500" />
            Participants
          </CardTitle>
          <span className="text-sm text-gray-500">
            {participantCount} / {capacity}
            {spotsLeft > 0 && (
              <span className="ml-2 text-success-600">
                ({spotsLeft} places restantes)
              </span>
            )}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-beige-200 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              spotsLeft === 0
                ? "bg-error-500"
                : spotsLeft <= 5
                ? "bg-warning-500"
                : "bg-bordeaux-500"
            }`}
            style={{ width: `${Math.min((participantCount / capacity) * 100, 100)}%` }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {participants.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Aucun participant pour le moment. Soyez le premier !
          </p>
        ) : (
          <div className="space-y-3">
            {participants.map((participant: any) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-beige-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={participant.user?.avatarUrl} />
                    <AvatarFallback className="bg-bordeaux-100 text-bordeaux-600">
                      {participant.user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-800">
                      {participant.user?.fullName || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Inscrit le{" "}
                      {format(new Date(participant.createdAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Badge de statut */}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    participant.status === "CONFIRMED"
                      ? "bg-success-50 text-success-600"
                      : participant.status === "PENDING"
                      ? "bg-warning-50 text-warning-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {participant.status === "CONFIRMED"
                    ? "Confirmé"
                    : participant.status === "PENDING"
                    ? "En attente"
                    : participant.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🎯 Partie 5 : Page de Détails de l'Événement

### Étape 5.1 : Créer la page complète

**Fichier à créer** : `client/src/pages/event-details-page.tsx`

```tsx
// client/src/pages/event-details-page.tsx

import { useRoute, Link } from "wouter";
import { useEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { ParticipateButton } from "@/components/ParticipateButton";
import { ParticipantsList } from "@/components/ParticipantsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Euro,
  Users,
  ArrowLeft,
  Share2,
  Edit,
  Loader2,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventDetailsPage() {
  // Récupérer l'ID depuis l'URL
  const [, params] = useRoute("/event/:id");
  const eventId = params?.id ? parseInt(params.id) : 0;

  const { user } = useAuth();
  const { data: eventData, isLoading, error } = useEvent(eventId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-bordeaux-500" />
      </div>
    );
  }

  // Error state
  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-beige-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-bordeaux-700 mb-4">
          Événement non trouvé
        </h1>
        <p className="text-gray-600 mb-6">
          Cet événement n'existe pas ou a été supprimé.
        </p>
        <Link href="/">
          <Button className="btn-primary">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const event = eventData.event;
  const isOwner = user?.id === event.organizerId;
  const eventIsPast = isPast(new Date(event.startDatetime));
  const isFull = (event.participantCount || 0) >= event.capacity;
  const isFree = Number(event.price) === 0;

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-bordeaux-400 to-bordeaux-600">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-24 h-24 text-white/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Bouton retour */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" className="bg-white/20 backdrop-blur text-white hover:bg-white/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Actions (si propriétaire) */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Link href={`/event/${eventId}/edit`}>
              <Button variant="ghost" className="bg-white/20 backdrop-blur text-white hover:bg-white/30">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </Link>
          </div>
        )}

        {/* Badge prix */}
        <div className="absolute bottom-4 right-4">
          <span
            className={`px-4 py-2 rounded-full text-lg font-bold shadow-lg ${
              isFree ? "bg-success-500 text-white" : "bg-white text-bordeaux-600"
            }`}
          >
            {isFree ? "Gratuit" : `${event.price} €`}
          </span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container-app py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titre et infos */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-bordeaux-700 mb-4">
                {event.title}
              </h1>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-beige-100 text-bordeaux-600 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Infos principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Card className="border-beige-200">
                  <CardContent className="flex items-center p-4">
                    <div className="p-3 bg-bordeaux-50 rounded-lg mr-4">
                      <Calendar className="w-6 h-6 text-bordeaux-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold capitalize">
                        {format(new Date(event.startDatetime), "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-beige-200">
                  <CardContent className="flex items-center p-4">
                    <div className="p-3 bg-bordeaux-50 rounded-lg mr-4">
                      <Clock className="w-6 h-6 text-bordeaux-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Horaires</p>
                      <p className="font-semibold">
                        {format(new Date(event.startDatetime), "HH:mm", { locale: fr })}
                        {event.endDatetime && (
                          <> - {format(new Date(event.endDatetime), "HH:mm", { locale: fr })}</>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-beige-200">
                  <CardContent className="flex items-center p-4">
                    <div className="p-3 bg-bordeaux-50 rounded-lg mr-4">
                      <MapPin className="w-6 h-6 text-bordeaux-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lieu</p>
                      <p className="font-semibold">{event.location}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-beige-200">
                  <CardContent className="flex items-center p-4">
                    <div className="p-3 bg-bordeaux-50 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-bordeaux-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Places</p>
                      <p className="font-semibold">
                        {event.participantCount || 0} / {event.capacity}
                        {isFull && (
                          <span className="ml-2 text-error-500">(Complet)</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Description */}
            <Card className="border-beige-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-bordeaux-700 mb-4">
                  À propos de cet événement
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {event.description || "Aucune description disponible."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Organisateur */}
            {event.organizer && (
              <Card className="border-beige-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-bordeaux-700 mb-4">
                    Organisateur
                  </h2>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-bordeaux-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-bordeaux-600 font-bold text-lg">
                        {event.organizer.fullName?.charAt(0)?.toUpperCase() || "O"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {event.organizer.fullName}
                      </p>
                      <p className="text-sm text-gray-500">Organisateur</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bouton de participation */}
            <Card className="border-beige-200 sticky top-24">
              <CardContent className="p-6">
                <ParticipateButton
                  eventId={eventId}
                  isFull={isFull}
                  isPast={eventIsPast}
                  className="w-full"
                />

                {/* Bouton partager */}
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => {
                    navigator.share?.({
                      title: event.title,
                      url: window.location.href,
                    }) || navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </CardContent>
            </Card>

            {/* Liste des participants */}
            <ParticipantsList eventId={eventId} capacity={event.capacity} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Partie 6 : Ajouter la Route Backend Manquante

### Étape 6.1 : Route pour vérifier sa participation

**Fichier à modifier** : `AdelBackend-main/src/routes/inscriptions.routes.js`

Ajoutez cette route :

```javascript
/**
 * @route GET /api/events/:eventId/inscriptions/me
 * @desc Vérifier si l'utilisateur est inscrit à un événement
 * @access Private
 */
router.get('/events/:eventId/inscriptions/me', authenticate, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const inscription = await Inscription.findOne({
      where: {
        event_id: eventId,
        user_id: req.userId,
        status: { [Op.ne]: 'CANCELLED' }
      }
    });
    
    if (!inscription) {
      return res.status(404).json({ message: 'Non inscrit' });
    }
    
    res.json({ inscription });
  } catch (error) {
    next(error);
  }
});
```

---

## 🧪 Exercices Pratiques

### Exercice 1 : Notification par Email

Envoyez un email de confirmation lors de l'inscription.

**Indices** :
- Utilisez le service email existant dans le backend
- Créez un template HTML pour l'email

### Exercice 2 : Liste d'Attente

Si l'événement est complet, permettez aux utilisateurs de s'inscrire sur une liste d'attente.

**Instructions** :
1. Ajoutez un statut "WAITLIST" dans le modèle Inscription
2. Modifiez le bouton pour afficher "Rejoindre la liste d'attente"
3. Notifiez les utilisateurs quand une place se libère

### Exercice 3 : Rappel d'Événement

Créez un système de rappel 24h avant l'événement.

**Instructions** :
1. Ajoutez un champ `reminder_sent` dans Inscription
2. Créez un job CRON qui vérifie les événements du lendemain
3. Envoyez un email de rappel

---

## ✅ Checklist de Validation

- [ ] Le bouton "Participer" fonctionne
- [ ] Le bouton "Se désinscrire" fonctionne avec confirmation
- [ ] La liste des participants s'affiche
- [ ] La barre de progression des places fonctionne
- [ ] L'état "Complet" s'affiche quand il n'y a plus de places
- [ ] L'état "Événement terminé" s'affiche pour les événements passés
- [ ] L'interface est responsive

---

## 🎓 Récapitulatif du Projet

Félicitations ! Vous avez maintenant une application complète avec :

| Fonctionnalité | TP |
|----------------|-----|
| CRUD Événements | TP1 |
| Dashboard Admin | TP2 |
| Dashboard User | TP3 |
| Thème Beige/Bordeaux | TP4 |
| Système de Participation | TP5 |

### Prochaines Étapes Suggérées

1. **Paiements** : Intégrer Stripe pour les événements payants
2. **Notifications temps réel** : Utiliser Socket.io
3. **PWA** : Rendre l'app installable sur mobile
4. **Tests** : Ajouter des tests unitaires et E2E

---

**Bravo ! Vous avez terminé tous les TPs ! 🎉🎓**
