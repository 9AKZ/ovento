import { z } from "zod";

// ============================================
// SCHÉMAS ZOD POUR LA VALIDATION
// Ces schémas définissent la structure des données
// échangées entre le frontend et le backend
// ============================================

// === SCHÉMA UTILISATEUR ===

export const userSchema = z.object({
  id: z.string().or(z.number()),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["USER", "ORGANIZER", "ADMIN"]).default("USER"),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isVerified: z.boolean().default(false),
  createdAt: z.string().optional(),
});

export const insertUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["USER", "ORGANIZER"]).optional().default("USER"),
});

// === SCHÉMA ÉVÉNEMENT ===

export const eventSchema = z.object({
  id: z.string().or(z.number()),
  title: z.string(),
  description: z.string().optional(),
  location: z.string(),
  startDatetime: z.string(),
  endDatetime: z.string().optional(),
  capacity: z.number().default(100),
  currentParticipants: z.number().optional(),
  participantCount: z.number().optional(),
  remainingSpots: z.number().optional(),
  price: z.string().or(z.number()).default("0"),
  currency: z.string().default("EUR"),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).default("DRAFT"),
  imageUrl: z.string().nullable().optional(),
  organizerId: z.string().or(z.number()),
  isOwner: z.boolean().optional(),
  isJoined: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export const insertEventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  location: z.string().min(1, "Le lieu est obligatoire"),
  startDatetime: z.string().min(1, "La date de début est obligatoire"),
  endDatetime: z.string().optional(),
  capacity: z.coerce.number().min(1).default(100),
  price: z.coerce.number().min(0).default(0),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

// === SCHÉMA INSCRIPTION/PARTICIPANT ===

export const inscriptionSchema = z.object({
  id: z.string().or(z.number()),
  eventId: z.string().or(z.number()),
  userId: z.string().or(z.number()),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).default("PENDING"),
  createdAt: z.string().optional(),
});

// ============================================
// TYPES TYPESCRIPT INFÉRÉS DEPUIS ZOD
// ============================================

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Inscription = z.infer<typeof inscriptionSchema>;

// === TYPES POUR LES REQUÊTES/RÉPONSES API ===

export type LoginRequest = { 
  email: string; 
  password: string; 
};

export type RegisterRequest = InsertUser;

export type AuthResponse = {
  message: string;
  user: User;
  accessToken?: string;
  refreshToken?: string;
};

export type EventResponse = Event & { 
  participantCount?: number;
  isOwner?: boolean;
  isJoined?: boolean;
  organizer?: { 
    id: string | number;
    fullName: string; 
    email?: string;
  };
};

export type EventsListResponse = EventResponse[];

export type CreateEventRequest = InsertEvent;
export type UpdateEventRequest = Partial<InsertEvent>;

export type EventFilters = {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
};
