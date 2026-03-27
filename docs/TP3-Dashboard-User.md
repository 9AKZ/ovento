# 👤 TP3 : Tableau de Bord Utilisateur

## Objectifs du TP

- ✅ Créer une page profil utilisateur
- ✅ Afficher les événements auxquels l'utilisateur participe
- ✅ Afficher les événements créés par l'utilisateur
- ✅ Permettre la modification du profil

**Durée** : 3 heures | **Niveau** : ⭐⭐

---

## Partie 1 : Routes Backend

### 1.1 Ajouter les routes utilisateur

**Fichier** : `AdelBackend-main/src/routes/users.routes.js`

Ajoutez ces routes :

```javascript
// GET /api/users/me/events - Événements créés par l'utilisateur
router.get('/me/events', authenticate, UserController.getMyCreatedEvents);

// GET /api/users/me/participations - Participations de l'utilisateur
router.get('/me/participations', authenticate, UserController.getMyParticipations);

// PATCH /api/users/me - Modifier son profil
router.patch('/me', authenticate, UserController.updateProfile);
```

### 1.2 Implémenter dans UserController

**Fichier** : `AdelBackend-main/src/controllers/UserController.js`

```javascript
async getMyCreatedEvents(req, res, next) {
  try {
    const events = await Event.findAll({
      where: { organizer_id: req.userId },
      order: [['created_at', 'DESC']],
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
}

async getMyParticipations(req, res, next) {
  try {
    const inscriptions = await Inscription.findAll({
      where: { user_id: req.userId },
      include: [{ model: Event, as: 'event' }],
      order: [['created_at', 'DESC']],
    });
    res.json({ participations: inscriptions });
  } catch (error) {
    next(error);
  }
}

async updateProfile(req, res, next) {
  try {
    const { fullName, bio } = req.body;
    const user = await User.findByPk(req.userId);
    await user.update({ full_name: fullName, bio });
    res.json({ message: 'Profil mis à jour', user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
}
```

---

## Partie 2 : Hook Frontend

**Fichier à créer** : `client/src/hooks/use-user-dashboard.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useMyEvents() {
  return useQuery({
    queryKey: ["user", "my-events"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/events", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });
}

export function useMyParticipations() {
  return useQuery({
    queryKey: ["user", "participations"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/participations", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { fullName: string; bio?: string }) => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profil mis à jour" });
    },
  });
}
```

---

## Partie 3 : Page Dashboard User

**Fichier à créer** : `client/src/pages/user-dashboard-page.tsx`

```tsx
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMyEvents, useMyParticipations, useUpdateProfile } from "@/hooks/use-user-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { data: eventsData, isLoading: eventsLoading } = useMyEvents();
  const { data: participationsData, isLoading: participationsLoading } = useMyParticipations();
  const updateMutation = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");

  const handleUpdateProfile = () => {
    updateMutation.mutate({ fullName, bio });
  };

  return (
    <div className="min-h-screen bg-beige-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-bordeaux-700">Mon Espace</h1>

        <Tabs defaultValue="profile">
          <TabsList className="bg-white border border-beige-200">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="events">Mes Événements</TabsTrigger>
            <TabsTrigger value="participations">Mes Participations</TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile">
            <Card className="border-beige-200">
              <CardHeader>
                <CardTitle>Modifier mon profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom complet</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1"
                    placeholder="Parlez-nous de vous..."
                  />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateMutation.isPending}
                  className="bg-bordeaux-500 hover:bg-bordeaux-600"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Enregistrer"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Mes Événements */}
          <TabsContent value="events">
            {eventsLoading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : eventsData?.events?.length === 0 ? (
              <Card className="border-beige-200 p-8 text-center">
                <p className="text-gray-500">Vous n'avez pas encore créé d'événement.</p>
                <Link href="/create">
                  <Button className="mt-4 bg-bordeaux-500">Créer un événement</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {eventsData?.events?.map((event: any) => (
                  <Card key={event.id} className="border-beige-200">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(event.start_datetime), "d MMM yyyy", { locale: fr })}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                      <Link href={`/event/${event.id}`}>
                        <Button variant="outline" className="mt-3 w-full">Voir</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Participations */}
          <TabsContent value="participations">
            {participationsLoading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : participationsData?.participations?.length === 0 ? (
              <Card className="border-beige-200 p-8 text-center">
                <p className="text-gray-500">Vous ne participez à aucun événement.</p>
                <Link href="/">
                  <Button className="mt-4 bg-bordeaux-500">Découvrir les événements</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {participationsData?.participations?.map((p: any) => (
                  <Card key={p.id} className="border-beige-200">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg">{p.event?.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {p.event?.start_datetime && format(new Date(p.event.start_datetime), "d MMM yyyy", { locale: fr })}
                      </div>
                      <Link href={`/event/${p.event?.id}`}>
                        <Button variant="outline" className="mt-3 w-full">Voir</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## Partie 4 : Ajouter la route

Dans `client/src/App.tsx`, ajoutez :

```tsx
import UserDashboardPage from "@/pages/user-dashboard-page";

// Dans le Router
<Route path="/dashboard">
  <Layout>
    <ProtectedRoute component={UserDashboardPage} />
  </Layout>
</Route>
```

---

## Exercices

1. **Ajouter un avatar** : Permettre l'upload d'une photo de profil
2. **Annuler une participation** : Ajouter un bouton pour se désinscrire
3. **Statistiques personnelles** : Afficher le nombre d'événements créés/participations

---

**Passez au [TP4 : Thème Beige/Bordeaux + Responsive](./TP4-Theme-Responsive.md)**
