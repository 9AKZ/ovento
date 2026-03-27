# 📝 TP1 : Gestion des Événements (CRUD Complet)

## Objectifs du TP

À la fin de ce TP, vous serez capable de :
- ✅ Comprendre le fonctionnement d'une API REST
- ✅ Créer une page de liste des événements
- ✅ Implémenter la création d'un événement
- ✅ Modifier un événement existant
- ✅ Supprimer un événement

**Durée estimée** : 3 heures  
**Niveau** : ⭐⭐ Intermédiaire

---

## 📚 Prérequis

Avant de commencer, assurez-vous que :
- Le backend tourne sur `http://localhost:4000`
- Le frontend tourne sur `http://localhost:8080`
- Vous avez créé un compte utilisateur avec le rôle "ORGANIZER"

---

## 🎯 Partie 1 : Comprendre l'API des Événements

### 1.1 Les Routes API disponibles

Ouvrez le fichier `AdelBackend-main/src/routes/events.routes.js` et observez les routes :

| Méthode | Route | Description | Authentification |
|---------|-------|-------------|------------------|
| GET | `/api/events` | Liste tous les événements | Non |
| GET | `/api/events/:id` | Détails d'un événement | Non |
| POST | `/api/events` | Créer un événement | Oui (Organizer) |
| PATCH | `/api/events/:id` | Modifier un événement | Oui (Propriétaire) |
| DELETE | `/api/events/:id` | Supprimer un événement | Oui (Propriétaire) |

### 1.2 Structure d'un Événement

Ouvrez `AdelBackend-main/src/models/Event.js` :

```javascript
// Les champs d'un événement
{
  id: UUID,              // Identifiant unique
  title: String,         // Titre (obligatoire)
  description: String,   // Description
  location: String,      // Lieu
  startDatetime: Date,   // Date de début (obligatoire)
  endDatetime: Date,     // Date de fin
  capacity: Integer,     // Capacité max (défaut: 100)
  price: Decimal,        // Prix (défaut: 0)
  currency: String,      // Devise (défaut: EUR)
  tags: Array,           // Tags/catégories
  status: Enum,          // DRAFT, PUBLISHED, CANCELLED
  image_url: String,     // URL de l'image
  organizer_id: UUID     // ID de l'organisateur
}
```

---

## 🛠 Partie 2 : Créer la Page de Liste des Événements

### Étape 2.1 : Créer le composant EventCard

**Fichier à créer** : `client/src/components/EventCard.tsx`

```tsx
// client/src/components/EventCard.tsx

import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, MapPin, Users, Euro } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Définition du type pour un événement
type Event = {
  id: number;
  title: string;
  description: string;
  location: string;
  startDatetime: string;
  capacity: number;
  price: string;
  tags: string[];
  status: string;
  imageUrl?: string;
  participantCount?: number;
};

// Props du composant
type EventCardProps = {
  event: Event;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  isOwner?: boolean;
};

export function EventCard({ event, onEdit, onDelete, isOwner }: EventCardProps) {
  // Formater la date en français
  const formattedDate = format(
    new Date(event.startDatetime),
    "EEEE d MMMM yyyy 'à' HH:mm",
    { locale: fr }
  );

  // Déterminer si l'événement est gratuit
  const isFree = Number(event.price) === 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image de l'événement */}
      <div className="relative h-48 bg-gradient-to-br from-bordeaux-100 to-beige-200">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-bordeaux-300" />
          </div>
        )}
        
        {/* Badge de prix */}
        <Badge className="absolute top-3 right-3 bg-white text-bordeaux-600">
          {isFree ? "Gratuit" : `${event.price} €`}
        </Badge>
        
        {/* Badge de statut si brouillon */}
        {event.status === "DRAFT" && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Brouillon
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-2">
          {event.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-1 rounded-full bg-beige-100 text-bordeaux-600"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Titre */}
        <Link href={`/event/${event.id}`}>
          <h3 className="text-xl font-bold text-bordeaux-700 hover:text-bordeaux-500 cursor-pointer line-clamp-1">
            {event.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Date */}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-bordeaux-400" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        
        {/* Lieu */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-bordeaux-400" />
          <span className="truncate">{event.location}</span>
        </div>
        
        {/* Participants */}
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2 text-bordeaux-400" />
          <span>
            {event.participantCount || 0} / {event.capacity} participants
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        {isOwner ? (
          // Boutons pour le propriétaire
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit?.(event.id)}
            >
              Modifier
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete?.(event.id)}
            >
              Supprimer
            </Button>
          </div>
        ) : (
          // Bouton pour voir les détails
          <Link href={`/event/${event.id}`} className="w-full">
            <Button className="w-full bg-bordeaux-500 hover:bg-bordeaux-600">
              Voir les détails
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
```

### Étape 2.2 : Comprendre le code

**Exercice** : Répondez aux questions suivantes :

1. Quelle bibliothèque est utilisée pour formater les dates ?
2. Que fait la fonction `format()` avec le paramètre `locale: fr` ?
3. Pourquoi utilise-t-on `line-clamp-1` sur le titre ?
4. Que signifie `event.tags?.slice(0, 3)` ?

<details>
<summary>📖 Voir les réponses</summary>

1. **date-fns** - Une bibliothèque légère pour manipuler les dates
2. Elle affiche la date en français (ex: "Lundi 15 janvier 2024")
3. Pour limiter le titre à une seule ligne et ajouter "..." si trop long
4. Le `?` est l'optional chaining (évite les erreurs si tags est undefined), `slice(0, 3)` prend les 3 premiers éléments

</details>

---

## 🛠 Partie 3 : Créer le Formulaire d'Événement

### Étape 3.1 : Créer le composant EventForm

**Fichier à créer** : `client/src/components/EventForm.tsx`

```tsx
// client/src/components/EventForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Schéma de validation avec Zod
const eventFormSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(255, "Le titre ne peut pas dépasser 255 caractères"),
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional(),
  location: z
    .string()
    .min(1, "Le lieu est obligatoire")
    .max(500, "Le lieu ne peut pas dépasser 500 caractères"),
  startDatetime: z.string().min(1, "La date de début est obligatoire"),
  endDatetime: z.string().optional(),
  capacity: z.coerce
    .number()
    .min(1, "La capacité doit être d'au moins 1")
    .max(100000, "La capacité ne peut pas dépasser 100 000"),
  price: z.coerce
    .number()
    .min(0, "Le prix ne peut pas être négatif")
    .max(999999, "Le prix ne peut pas dépasser 999 999"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

// Type inféré du schéma
type EventFormValues = z.infer<typeof eventFormSchema>;

// Props du composant
type EventFormProps = {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (data: EventFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export function EventForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Créer l'événement",
}: EventFormProps) {
  // Initialiser le formulaire avec react-hook-form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDatetime: "",
      endDatetime: "",
      capacity: 100,
      price: 0,
      status: "DRAFT",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Titre */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de l'événement *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Concert de Jazz au Parc"
                  className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre événement..."
                  className="min-h-32 bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Décrivez en détail ce qui attend les participants
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Lieu */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 123 Rue de la Paix, Paris"
                  className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDatetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date et heure de début *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDatetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date et heure de fin</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Capacité et Prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacité maximale</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Nombre maximum de participants</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="bg-beige-50 border-beige-200 focus:border-bordeaux-400"
                    {...field}
                  />
                </FormControl>
                <FormDescription>0 pour un événement gratuit</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Statut */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-beige-50 border-beige-200">
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="PUBLISHED">Publié</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Les brouillons ne sont visibles que par vous
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bouton de soumission */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-bordeaux-500 hover:bg-bordeaux-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 🛠 Partie 4 : Intégrer le Formulaire dans une Page

### Étape 4.1 : Modifier la page de création

**Fichier à modifier** : `client/src/pages/create-event-page.tsx`

Remplacez le contenu par :

```tsx
// client/src/pages/create-event-page.tsx

import { useLocation } from "wouter";
import { useCreateEvent } from "@/hooks/use-events";
import { EventForm } from "@/components/EventForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateEvent();

  const handleSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      // Rediriger vers la page d'accueil après création
      setLocation("/");
    } catch (error) {
      // L'erreur est gérée par le hook
      console.error("Erreur lors de la création:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Bouton retour */}
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </Link>

      <Card className="border-beige-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-bordeaux-500 to-bordeaux-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Créer un Événement</CardTitle>
          <CardDescription className="text-beige-100">
            Remplissez les informations ci-dessous pour créer votre événement
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 bg-beige-50">
          <EventForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Créer l'événement"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Partie 5 : Exercices Pratiques

### Exercice 1 : Ajouter un champ "Tags"

**Objectif** : Permettre à l'utilisateur d'ajouter des tags à son événement.

**Instructions** :
1. Dans `EventForm.tsx`, ajoutez un nouveau champ pour les tags
2. Les tags doivent être séparés par des virgules
3. Affichez les tags sous forme de badges

<details>
<summary>💡 Indice</summary>

Utilisez un `Input` simple et transformez la chaîne en tableau :

```tsx
const tagsArray = tagsString.split(",").map(tag => tag.trim());
```

</details>

### Exercice 2 : Créer une page de modification

**Objectif** : Créer une page `/event/:id/edit` pour modifier un événement.

**Instructions** :
1. Créez le fichier `client/src/pages/edit-event-page.tsx`
2. Récupérez l'événement existant avec `useEvent(id)`
3. Pré-remplissez le formulaire avec les données existantes
4. Utilisez `useUpdateEvent()` pour sauvegarder

### Exercice 3 : Ajouter la confirmation de suppression

**Objectif** : Demander confirmation avant de supprimer un événement.

**Instructions** :
1. Utilisez le composant `AlertDialog` de shadcn/ui
2. Affichez un message de confirmation
3. Appelez `useDeleteEvent()` seulement si confirmé

---

## ✅ Checklist de Validation

Avant de passer au TP suivant, vérifiez que :

- [ ] La liste des événements s'affiche correctement
- [ ] Le formulaire de création fonctionne
- [ ] La validation des champs fonctionne
- [ ] Les événements créés apparaissent dans la liste
- [ ] Les messages d'erreur s'affichent correctement

---

## 📚 Ressources Complémentaires

- [Documentation React Hook Form](https://react-hook-form.com/)
- [Documentation Zod](https://zod.dev/)
- [Documentation shadcn/ui](https://ui.shadcn.com/)
- [Documentation date-fns](https://date-fns.org/)

---

**Bravo ! Vous avez terminé le TP1 ! 🎉**

Passez maintenant au [TP2 : Tableau de Bord Admin](./TP2-Dashboard-Admin.md)
