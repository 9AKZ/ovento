import { useRoute, Link, useLocation } from "wouter";
import { useEvent, useJoinEvent, useLeaveEvent, useDeleteEvent, usePublishEvent, useUnpublishEvent, useCancelEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Share2,
  Trash2,
  Edit,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
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

export default function EventDetailsPage() {
  const [match, params] = useRoute("/event/:id");
  const [, setLocation] = useLocation();
  const id = (params as any)?.id ?? "";
  const { data, isLoading, error } = useEvent(id);
  const { user } = useAuth();

  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();
  const deleteMutation = useDeleteEvent();
  const publishMutation = usePublishEvent();
  const unpublishMutation = useUnpublishEvent();
  const cancelMutation = useCancelEvent();

  const isAdmin = user?.role === 'ADMIN';

  const handlePublish = () => {
    if (!data?.event) return;
    publishMutation.mutate(data.event.id, { onSuccess: () => setLocation(`/event/${data.event.id}`) });
  };

  const handleUnpublish = () => {
    if (!data?.event) return;
    unpublishMutation.mutate(data.event.id, { onSuccess: () => setLocation(`/event/${data.event.id}`) });
  };

  const handleCancel = () => {
    if (!data?.event) return;
    cancelMutation.mutate(data.event.id, { onSuccess: () => setLocation(`/event/${data.event.id}`) });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error || !data) {
    const message = error instanceof Error ? error.message : "Événement non trouvé";
    return (
      <div className="text-center p-20">
        <p className="text-lg font-semibold mb-2">Événement non trouvé</p>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }

  const { event } = data;

  const handleJoinToggle = () => {
    if (!user) return setLocation("/auth");
    if (event.isJoined) {
      leaveMutation.mutate(event.id);
    } else {
      joinMutation.mutate(event.id);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(event.id, {
      onSuccess: () => setLocation("/")
    });
  };

  return (
    <div className="max-w-full mx-auto space-y-8 pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all group mb-4">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Retour
          </Button>
        </Link>
      </motion.div>

      {/* Hero Image Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl overflow-hidden aspect-video md:aspect-[21/9] shadow-2xl group"
      >
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Calendar className="w-24 h-24 text-primary/20" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Price Badge */}
        <div className="absolute top-6 right-6">
          <Badge className="glass-badge bg-white/90 text-foreground text-base font-bold px-4 py-2 shadow-lg">
            {Number(event.price) === 0 ? "Gratuit" : `€${event.price}`}
          </Badge>
        </div>

        {/* Status Badge */}
        {event.status === "DRAFT" && (
          <div className="absolute top-6 left-6">
            <Badge variant="secondary" className="glass-badge bg-yellow-500/80 text-white">Brouillon</Badge>
          </div>
        )}
      </motion.div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4">
        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 space-y-8"
        >
          {/* Title & Tags */}
          <div className="flex items-center gap-4 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {event.currentParticipants ?? 0}/{event.capacity ?? 0} inscrits
            </span>
            <span className="text-xs font-bold text-primary">
              {event.capacity && event.capacity > 0
                ? Math.round((event.currentParticipants / event.capacity) * 100)
                : 0}%
            </span>
          </div>
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {event.tags?.map((tag) => (
                <Badge key={tag} className="text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary hover:bg-primary/25 border-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 leading-tight">
              {event.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-3xl">
              {event.description}
            </p>
          </div>

          {/* Key Info Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Calendar className="w-5 h-5" />
                <p className="text-sm font-semibold text-muted-foreground">Date & Heure</p>
              </div>
              <p className="text-lg font-bold">
                {format(new Date(event.startDatetime), "EEEE d MMMM yyyy")}
              </p>
              <p className="text-sm font-semibold text-primary">
                {format(new Date(event.startDatetime), "HH:mm")}
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-secondary mb-3">
                <MapPin className="w-5 h-5" />
                <p className="text-sm font-semibold text-muted-foreground">Lieu</p>
              </div>
              <p className="text-lg font-bold">
                {event.location}
              </p>
            </div>
          </div>

          {/* Participants Section */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-lg">Participants</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{event.participantCount} inscrit{event.participantCount > 1 ? 's' : ''}</span>
                  <span className="text-xs text-muted-foreground">Capacité: {event.capacity}</span>
                </div>
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((event.participantCount / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {event.capacity - event.participantCount > 0 
                  ? `${event.capacity - event.participantCount} place${event.capacity - event.participantCount > 1 ? 's' : ''} restante${event.capacity - event.participantCount > 1 ? 's' : ''}`
                  : "Événement complet"
                }
              </p>
            </div>
          </div>

          {/* Organizer Section */}
          {event.organizer && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Organisateur</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {event.organizer.avatarUrl ? (
                    <img 
                      src={event.organizer.avatarUrl} 
                      alt={event.organizer.fullName} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-bold text-lg">
                      {event.organizer.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{event.organizer.fullName}</p>
                  <p className="text-sm text-muted-foreground">Organisateur de l'événement</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Event Details */}
          {(event.endDatetime && new Date(event.endDatetime).getTime() !== new Date(event.startDatetime).getTime()) && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold text-lg">Détails supplémentaires</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">Date de fin:</span>
                  <span>{format(new Date(event.endDatetime), "EEEE d MMMM yyyy à HH:mm")}</span>
                </div>
                {event.currency && event.currency !== 'EUR' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Euro className="w-4 h-4 text-primary" />
                    <span className="font-medium">Devise:</span>
                    <span>{event.currency}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="text-xs">
                    {event.status === 'PUBLISHED' ? 'Publié' : event.status === 'DRAFT' ? 'Brouillon' : event.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-1"
        >
          <div className="sticky top-24 space-y-4">
            {/* CTA Button */}
            {(event.isOwner || isAdmin) ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-lg h-11 font-semibold">
                    <Edit className="w-4 h-4 mr-2" /> Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-lg h-11 font-semibold">
                        <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Cela supprimera définitivement l'événement et retirera tous les participants.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="space-y-2">
                {event.status === 'DRAFT' && (
                  <Button
                    variant="secondary"
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="w-full h-11 font-semibold"
                  >
                    Publier
                  </Button>
                )}
                {event.status === 'PUBLISHED' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleUnpublish}
                      disabled={unpublishMutation.isPending}
                      className="w-full h-11 font-semibold"
                    >
                      Mettre en brouillon
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending}
                      className="w-full h-11 font-semibold"
                    >
                      Annuler l'événement
                    </Button>
                  </>
                )}
              </div>
            </>
            ) : !user ? (
              <Link href="/auth">
                <Button className="w-full h-11 text-base font-semibold rounded-lg shadow-lg transition-all bg-muted text-foreground border border-border">
                  Se connecter
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleJoinToggle}
                disabled={joinMutation.isPending || leaveMutation.isPending}
                className={`w-full h-11 text-base font-semibold rounded-lg shadow-lg transition-all ${
                  event.isJoined 
                    ? "bg-destructive text-white border border-destructive hover:bg-destructive/90" 
                    : "bg-gradient-to-r from-primary to-secondary text-white border-0 hover:shadow-xl"
                }`}
              >
                {joinMutation.isPending || leaveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : event.isJoined ? (
                  <>Se désinscrire</>
                ) : (
                  <>Rejoindre cet événement</>
                )}
              </Button>
            )}

            {/* Info Card */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                {/* Share Button */}
                <Button variant="outline" className="w-full rounded-lg h-10 font-semibold">
                  <Share2 className="w-4 h-4 mr-2" /> Partager
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-accent/20 border border-accent/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Événement intéressant !</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {event.participantCount} personne{event.participantCount > 1 ? 's' : ''} intéressée{event.participantCount > 1 ? 's' : ''}{event.participantCount > 0 ? '.' : 's'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
