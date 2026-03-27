import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMyEvents } from "@/hooks/use-events";
import { api } from "../../shared/routes";
import { Loader2, Calendar, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  
  const { data: myEvents, isLoading: loadingMyEvents } = useMyEvents();

  // Fetch joined events
  const { data: joinedEvents, isLoading: loadingJoined } = useQuery({
    queryKey: [api.events.list.path, "joined"], 
    queryFn: async () => {
      const res = await fetch(api.events.list.path, { credentials: "include" });
      const allEvents = api.events.list.responses[200].parse(await res.json());
      return allEvents.filter(e => e.isJoined);
    },
    enabled: !!user,
  });

  if (!user) return <div>Veuillez vous connecter</div>;

  const EventCard = ({ event }: { event: any }) => (
    <Link href={`/event/${event.id}`}>
      <div className="group flex gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="w-24 h-24 rounded-lg bg-muted shrink-0 overflow-hidden">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/30">
              <Calendar className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{event.title}</h4>
            <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'} className="shrink-0">
              {event.status === 'PUBLISHED' ? 'PUBLIÉ' : 'BROUILLON'}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-2" />
              {format(new Date(event.startDatetime), "d MMM yyyy • HH:mm")}
            </div>
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-2" />
              {event.location}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Profile Header */}
      <div className="flex items-center justify-between bg-card p-8 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">{user.fullName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {user.role}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => logoutMutation.mutate()} className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Events Created */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Événements organisés</h2>
            <Badge variant="outline" className="text-xs">{myEvents?.length || 0}</Badge>
          </div>
          <div className="space-y-4">
            {loadingMyEvents ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            ) : myEvents?.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <p className="text-muted-foreground">Vous n'avez pas encore organisé d'événements.</p>
                <Link href="/create">
                  <Button variant="link" className="text-primary">Créez-en un maintenant</Button>
                </Link>
              </div>
            ) : (
              myEvents?.map(event => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </div>

        {/* Events Joined */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Ma participation</h2>
            <Badge variant="outline" className="text-xs">{joinedEvents?.length || 0}</Badge>
          </div>
          <div className="space-y-4">
            {loadingJoined ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            ) : joinedEvents?.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <p className="text-muted-foreground">Vous ne participez à aucun événement pour le moment.</p>
                <Link href="/">
                  <Button variant="link" className="text-primary">Explorer les événements</Button>
                </Link>
              </div>
            ) : (
              joinedEvents?.map(event => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
