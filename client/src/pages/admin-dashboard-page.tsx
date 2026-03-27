import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  Trash2,
  Shield,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Edit,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── HOOKS API ADMIN ──────────────────────────────────────────────

function useAdminStats() {
  return useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const [usersRes, eventsRes, inscriptionsRes] = await Promise.all([
        fetch("/api/users?limit=1", { credentials: "include" }),
        fetch("/api/events?limit=1&status=PUBLISHED", { credentials: "include" }),
        fetch("/api/events?limit=100", { credentials: "include" }),
      ]);
      const usersData = usersRes.ok ? await usersRes.json() : { total: 0 };
      const eventsData = eventsRes.ok ? await eventsRes.json() : { total: 0 };
      const allEventsData = inscriptionsRes.ok ? await inscriptionsRes.json() : { events: [] };
      const totalParticipants = (allEventsData.events || []).reduce(
        (acc: number, e: any) => acc + (e.currentParticipants || 0),
        0
      );
      return {
        totalUsers: usersData.total || 0,
        totalEvents: eventsData.total || 0,
        totalInscriptions: totalParticipants,
        publishedEvents: eventsData.total || 0,
      };
    },
  });
}

function useAdminUsers(search: string, role: string) {
  return useQuery({
    queryKey: ["/api/users", search, role],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (role && role !== "all") params.set("role", role);
      const res = await fetch(`/api/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement utilisateurs");
      return res.json();
    },
  });
}

function useAdminEvents(search: string, status: string) {
  return useQuery({
    queryKey: ["/api/events/admin", search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);
      // Admin sees all events including drafts
      const res = await fetch(`/api/events/my-events?${params}`, { credentials: "include" });
      if (!res.ok) {
        // fallback to public list
        const res2 = await fetch(`/api/events?${params}&includeUnpublished=true`, { credentials: "include" });
        if (!res2.ok) throw new Error("Erreur chargement événements");
        return res2.json();
      }
      const data = await res.json();
      return { events: Array.isArray(data) ? data : data.events || [] };
    },
  });
}

function useAdminInscriptions() {
  return useQuery({
    queryKey: ["/api/admin/inscriptions"],
    queryFn: async () => {
      // Fetch all events with detailed inscription data
      const res = await fetch("/api/events?limit=100&includeUnpublished=true", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur chargement inscriptions");
      const data = await res.json();
      // Flatten inscriptions from all events
      const allInscriptions: any[] = [];
      (data.events || data || []).forEach((event: any) => {
        if (event.inscriptions) {
          allInscriptions.push(...event.inscriptions.map((i: any) => ({ ...i, eventTitle: event.title })));
        }
      });
      return { inscriptions: allInscriptions };
    },
  });
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatus, setEventStatus] = useState("all");

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(userSearch, userRole);
  const { data: eventsData, isLoading: eventsLoading } = useAdminEvents(eventSearch, eventStatus);
  const { data: inscriptionsData, isLoading: inscriptionsLoading } = useAdminInscriptions();

  // Redirect if not admin
  if (user && user.role !== "ADMIN") {
    setLocation("/");
    return null;
  }

  // ── Mutation: Changer rôle utilisateur
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur modification rôle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Rôle mis à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // ── Mutation: Supprimer utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur suppression utilisateur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utilisateur supprimé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // ── Mutation: Supprimer événement
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur suppression événement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Événement supprimé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // ── Mutation: Publier/Dépublier événement
  const togglePublishMutation = useMutation({
    mutationFn: async ({ eventId, action }: { eventId: string; action: "publish" | "unpublish" | "cancel" }) => {
      const res = await fetch(`/api/events/${eventId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur action événement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Événement mis à jour" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const users = usersData?.users || [];
  const events = eventsData?.events || [];
  const inscriptions = inscriptionsData?.inscriptions || [];

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    ORGANIZER: "bg-blue-100 text-blue-700 border-blue-200",
    USER: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-green-100 text-green-700",
    DRAFT: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  // ── Stat Card
  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: number | string;
    color: string;
  }) => (
    <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{statsLoading ? "…" : value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Administration</h1>
          <p className="text-muted-foreground text-sm">
            Tableau de bord administrateur — {user?.fullName}
          </p>
        </div>
      </div>

      {/* ── STATISTIQUES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats?.totalUsers || 0}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Événements publiés"
          value={stats?.publishedEvents || 0}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Inscriptions totales"
          value={stats?.totalInscriptions || 0}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Taux moyen"
          value={
            stats?.publishedEvents && stats?.totalInscriptions
              ? `${Math.round((stats.totalInscriptions / (stats.publishedEvents * 100)) * 100)}%`
              : "0%"
          }
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* ── ONGLETS */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="users" className="rounded-lg gap-2">
            <Users className="w-4 h-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg gap-2">
            <Calendar className="w-4 h-4" /> Événements
          </TabsTrigger>
          <TabsTrigger value="inscriptions" className="rounded-lg gap-2">
            <ClipboardList className="w-4 h-4" /> Inscriptions
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-lg gap-2">
            <BarChart3 className="w-4 h-4" /> Statistiques
          </TabsTrigger>
        </TabsList>

        {/* ══ ONGLET UTILISATEURS ══ */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                className="pl-9"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="USER">Utilisateurs</SelectItem>
                <SelectItem value="ORGANIZER">Organisateurs</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-4">Utilisateur</th>
                      <th className="text-left p-4">Rôle</th>
                      <th className="text-left p-4">Vérifié</th>
                      <th className="text-left p-4">Inscrit le</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                              {(u.fullName || u.full_name || "?").charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{u.fullName || u.full_name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Select
                            value={u.role}
                            onValueChange={(role) =>
                              updateRoleMutation.mutate({ userId: u.id, role })
                            }
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className={`w-36 h-8 text-xs border ${roleColors[u.role] || ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">Utilisateur</SelectItem>
                              <SelectItem value="ORGANIZER">Organisateur</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          {u.isVerified || u.is_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300" />
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {u.createdAt || u.created_at
                            ? format(new Date(u.createdAt || u.created_at), "dd/MM/yyyy")
                            : "—"}
                        </td>
                        <td className="p-4 text-right">
                          {u.id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action supprimera définitivement{" "}
                                    <strong>{u.fullName || u.full_name}</strong> et toutes ses données.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => deleteUserMutation.mutate(u.id)}
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ══ ONGLET ÉVÉNEMENTS ══ */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un événement..."
                className="pl-9"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
            </div>
            <Select value={eventStatus} onValueChange={setEventStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PUBLISHED">Publiés</SelectItem>
                <SelectItem value="DRAFT">Brouillons</SelectItem>
                <SelectItem value="CANCELLED">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-4">Événement</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Participants</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {events.map((e: any) => (
                      <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{e.title}</p>
                            <p className="text-xs text-muted-foreground">{e.location}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[e.status] || ""}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {e.currentParticipants ?? 0} / {e.capacity}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {e.startDatetime
                            ? format(new Date(e.startDatetime), "dd/MM/yyyy")
                            : "—"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Voir */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => window.location.href = `/event/${e.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Publier / Dépublier */}
                            {e.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-green-600 hover:bg-green-50"
                                onClick={() => togglePublishMutation.mutate({ eventId: e.id, action: "publish" })}
                                title="Publier"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {e.status === "PUBLISHED" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-orange-500 hover:bg-orange-50"
                                onClick={() => togglePublishMutation.mutate({ eventId: e.id, action: "unpublish" })}
                                title="Mettre en brouillon"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {e.status !== "CANCELLED" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-yellow-600 hover:bg-yellow-50"
                                onClick={() => togglePublishMutation.mutate({ eventId: e.id, action: "cancel" })}
                                title="Annuler"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Supprimer */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action supprimera définitivement <strong>{e.title}</strong>{" "}
                                    et notifiera tous les participants.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => deleteEventMutation.mutate(e.id)}
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          Aucun événement trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ══ ONGLET INSCRIPTIONS ══ */}
        <TabsContent value="inscriptions" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Vos inscriptions en tant qu'admin — pour voir toutes les inscriptions d'un événement,
              consultez la page détail de l'événement.
            </p>

            {inscriptionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : inscriptions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune inscription</p>
            ) : (
              <div className="space-y-3">
                {inscriptions.map((insc: any) => (
                  <div
                    key={insc.id}
                    className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/30"
                  >
                    <div>
                      <p className="font-semibold text-sm">{insc.event?.title || "Événement"}</p>
                      <p className="text-xs text-muted-foreground">
                        {insc.event?.startDatetime
                          ? format(new Date(insc.event.startDatetime), "dd/MM/yyyy")
                          : "—"}{" "}
                        — {insc.event?.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          insc.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : insc.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {insc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ══ ONGLET STATISTIQUES ══ */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Stats globales */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Vue d'ensemble
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Utilisateurs total", value: stats?.totalUsers || 0, color: "bg-blue-500" },
                  { label: "Événements publiés", value: stats?.publishedEvents || 0, color: "bg-green-500" },
                  { label: "Inscriptions totales", value: stats?.totalInscriptions || 0, color: "bg-purple-500" },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-bold">{statsLoading ? "…" : stat.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stat.color} rounded-full transition-all`}
                        style={{ width: `${Math.min((stat.value / Math.max(stats?.totalUsers || 1, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition des rôles */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Répartition des rôles
              </h3>
              {usersLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(["USER", "ORGANIZER", "ADMIN"] as const).map((role) => {
                    const count = users.filter((u: any) => u.role === role).length;
                    const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                    return (
                      <div key={role} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={`font-semibold px-2 py-0.5 rounded text-xs ${roleColors[role]}`}>
                            {role}
                          </span>
                          <span className="text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              role === "ADMIN" ? "bg-red-500" : role === "ORGANIZER" ? "bg-blue-500" : "bg-gray-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Statut des événements */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 md:col-span-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Statut des événements
              </h3>
              {eventsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {(["PUBLISHED", "DRAFT", "CANCELLED"] as const).map((status) => {
                    const count = events.filter((e: any) => e.status === status).length;
                    const icons = {
                      PUBLISHED: <CheckCircle className="w-5 h-5 text-green-600" />,
                      DRAFT: <Edit className="w-5 h-5 text-yellow-600" />,
                      CANCELLED: <XCircle className="w-5 h-5 text-red-500" />,
                    };
                    const labels = { PUBLISHED: "Publiés", DRAFT: "Brouillons", CANCELLED: "Annulés" };
                    return (
                      <div
                        key={status}
                        className={`rounded-xl p-4 border text-center ${statusColors[status]} bg-opacity-20`}
                      >
                        <div className="flex justify-center mb-2">{icons[status]}</div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs font-semibold mt-1">{labels[status]}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}