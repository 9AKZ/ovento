import { useState } from "react";
import { useEvents, useJoinEvent, useLeaveEvent, useDeleteEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  Euro,
  Loader2,
  Trash2,
  Sparkles,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { motion } from "framer-motion";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const apiFilters = {
    search: search || undefined,
  };

  const { data: events, isLoading, error } = useEvents(apiFilters);
  console.log('DEBUG: home events', { events, isLoading, error });
  const { user } = useAuth();
  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const deleteMutation = useDeleteEvent();

  const handleJoinToggle = (eventId: string | number, isJoined: boolean) => {
    if (!user) return;
    if (isJoined) {
      leaveMutation.mutate(String(eventId));
    } else {
      joinMutation.mutate(String(eventId));
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Une erreur est survenue</h2>
        <p className="text-muted-foreground mb-4">Impossible de charger les événements. Veuillez réessayer.</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 border border-border/30 p-8 md:p-12 min-h-64 flex items-center"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-10 left-10 w-56 h-56 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>

        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Découvrez</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5 flex flex-col md:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des événements..."
                className="pl-11 h-11 bg-background/50 border-border/40 focus:ring-primary/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-52">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-11 bg-background/50 border-border/40 focus:ring-primary/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <SelectValue placeholder="Filtrer par" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="weekend">Ce week-end</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des événements..."
            className="pl-9 bg-background border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-background border-border/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filtrer par" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="weekend">Ce week-end</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold mb-2">Aucun événement trouvé</h3>
          <p className="text-muted-foreground mb-6">Essayez d'ajuster vos filtres ou créez un nouvel événement.</p>
          {user && (
            <Link href="/create">
              <Button>Créer un événement</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="event-card flex flex-col h-full"
            >
              {/* Image Area */}
              <div className="event-image-wrapper">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary/20">
                    <Calendar className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className="glass-badge bg-white/80">
                    {Number(event.price) === 0 ? "Gratuit" : `€${event.price}`}
                  </Badge>
                  {event.status === "DRAFT" && (
                    <Badge variant="secondary" className="glass-badge">Brouillon</Badge>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex gap-2 mb-2 flex-wrap">
                  {event.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} className="text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary hover:bg-primary/25 border-0">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {event.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-shrink-0">
                  {event.description || "Pas de description disponible"}
                </p>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium">{format(new Date(event.startDatetime), "d MMM • HH:mm")}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{event.location}</span>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">{event.currentParticipants ?? 0}/{event.capacity ?? 0} inscrits</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {event.capacity && event.capacity > 0
                          ? Math.round((event.currentParticipants / event.capacity) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden shadow-sm">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-300 shadow-md"
                        style={{ width: `${Math.min((event.currentParticipants / event.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-border/30">
                  <Link href={`/event/${event.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Détails
                    </Button>
                  </Link>
                  {user ? (
                    event.isOwner ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Tous les participants seront notifiés.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                              onClick={() => deleteMutation.mutate(Number(event.id))}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        onClick={() => handleJoinToggle(event.id, !!event.isJoined)}
                        disabled={joinMutation.isPending || leaveMutation.isPending}
                        size="sm"
                        className={`flex-1 font-semibold transition-all ${
                          event.isJoined
                            ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/15"
                            : "bg-gradient-to-r from-primary to-secondary text-white border-0 hover:shadow-lg"
                        }`}
                      >
                        {(joinMutation.isPending || leaveMutation.isPending) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : event.isJoined ? (
                          <>Se désinscrire</>
                        ) : (
                          <>Rejoindre</>
                        )}
                      </Button>
                    )
                  ) : (
                    <Link href="/auth" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Se connecter
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}