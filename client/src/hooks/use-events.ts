import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "../../shared/routes";
import type { EventFilters, InsertEvent } from "../../shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useEvents(filters?: EventFilters) {
  // Convert filters to query string
  const queryString = filters 
    ? new URLSearchParams(
        Object.entries(filters).reduce((acc, [key, val]) => {
          if (val !== undefined && val !== "") acc[key] = String(val);
          return acc;
        }, {} as Record<string, string>)
      ).toString()
    : "";

  const queryKey = filters ? [api.events.list.path, queryString] : [api.events.list.path];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = filters ? `${api.events.list.path}?${queryString}` : api.events.list.path;
      const res = await fetch(url, { credentials: "include", cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      // Server returns { events: [...], total, page, limit }
      const events = data.events || [];
      return api.events.list.responses[200].parse(events);
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url, { credentials: "include", cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch event (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      try {
        return api.events.get.responses[200].parse(json);
      } catch (parseError) {
        console.error("Event fetch parse error", { url, json, parseError });
        throw parseError;
      }
    },
    enabled: !!id,
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: [api.events.myEvents.path],
    queryFn: async () => {
      const res = await fetch(api.events.myEvents.path, { credentials: "include", cache: 'no-store' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Impossible de charger vos événements');
      }
      return api.events.myEvents.responses[200].parse(await res.json());
    },
    enabled: true,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create event");
      }
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.myEvents.path] });
      toast({ title: "Succès", description: "Événement créé avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertEvent> & { id: number }) => {
      const url = buildUrl(api.events.update.path, { id });
      const res = await fetch(url, {
        method: api.events.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de la mise à jour");
      }
      return api.events.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.myEvents.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.get.path, data.event.id] });
      toast({ title: "Succès", description: "Événement mis à jour avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.delete.path, { id });
      const res = await fetch(url, {
        method: api.events.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      return api.events.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.myEvents.path] });
      toast({ title: "Supprimé", description: "L'événement a été supprimé avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.publish.path, { id });
      const res = await fetch(url, {
        method: api.events.publish.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de publication");
      }
      return api.events.publish.responses[200].parse(await res.json());
    },
    onSuccess: ({ event }) => {
      queryClient.invalidateQueries();
      toast({ title: "Publiée", description: "L'événement a été publié avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useUnpublishEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.unpublish.path, { id });
      const res = await fetch(url, {
        method: api.events.unpublish.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de dépublication");
      }
      return api.events.unpublish.responses[200].parse(await res.json());
    },
    onSuccess: ({ event }) => {
      queryClient.invalidateQueries();
      toast({ title: "Brouillon", description: "L'événement a été remis en brouillon" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.cancel.path, { id });
      const res = await fetch(url, {
        method: api.events.cancel.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de l'annulation");
      }
      return api.events.cancel.responses[200].parse(await res.json());
    },
    onSuccess: ({ event }) => {
      queryClient.invalidateQueries();
      toast({ title: "Annulé", description: "L'événement a été annulé avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.events.join.path, { id });
      const res = await fetch(url, {
        method: api.events.join.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Impossible de rejoindre l'événement");
      }
      
      const data = await res.json();
      return { id, alreadyJoined: data.inscription?.alreadyJoined || false };
    },
    onSuccess: async (data) => {
      // Update cache with isJoined: true
      queryClient.setQueryData([api.events.get.path, data.id], (old: any) => {
        if (!old || !old.event) return old;
        return {
          ...old,
          event: {
            ...old.event,
            isJoined: true,
          },
        };
      });

      queryClient.setQueryData([api.events.list.path], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((evt: any) => 
          evt.id === data.id ? { ...evt, isJoined: true } : evt
        );
      });

      // Invalidate to ensure fresh data everywhere
      queryClient.invalidateQueries();
      
      // Only show toast on new registration
      if (!data.alreadyJoined) {
        toast({ title: "Inscrit !", description: "Vous participez maintenant à cet événement" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.events.leave.path, { id });
      const res = await fetch(url, {
        method: api.events.leave.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Impossible de quitter l'événement");
      return api.events.leave.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries();
      toast({ title: "Quitté", description: "Vous ne participez plus à cet événement" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function useUploadEventImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const url = buildUrl("/api/events/:id/image", { id });
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Échec de l'upload");
      }
      return await res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.events.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Succès", description: "Image uploadée avec succès" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}
