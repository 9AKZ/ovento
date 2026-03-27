import { z } from 'zod';
import { 
  insertUserSchema, 
  insertEventSchema, 
  userSchema, 
  eventSchema,
  type User,
  type Event,
  type EventResponse,
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: insertUserSchema,
      responses: {
        201: z.object({
          message: z.string(),
          user: userSchema,
        }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          message: z.string(),
          user: userSchema,
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({
          user: userSchema,
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      input: z.object({
        search: z.string().optional(),
        location: z.string().optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(eventSchema.extend({ participantCount: z.number().optional(), isJoined: z.boolean().optional() })),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.object({
          event: eventSchema.extend({ participantCount: z.number().optional(), isJoined: z.boolean().optional() }),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: {
        201: z.object({
          message: z.string(),
          event: eventSchema,
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/events/:id',
      input: insertEventSchema.partial(),
      responses: {
        200: z.object({
          message: z.string(),
          event: eventSchema,
        }),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id',
      responses: {
        200: z.object({ message: z.string() }),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/events/:id/inscriptions',
      responses: {
        200: z.object({ message: z.string() }),
        201: z.object({ message: z.string(), inscription: z.any() }),
        401: errorSchemas.unauthorized,
      },
    },
    leave: {
      method: 'DELETE' as const,
      path: '/api/events/:id/inscriptions',
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    myEvents: {
      method: 'GET' as const,
      path: '/api/events/my-events',
      responses: {
        200: z.array(eventSchema.extend({ participantCount: z.number().optional(), isJoined: z.boolean().optional() })),
        401: errorSchemas.unauthorized,
        403: errorSchemas.unauthorized,
      },
    },
    publish: {
      method: 'POST' as const,
      path: '/api/events/:id/publish',
      responses: {
        200: z.object({ message: z.string(), event: eventSchema }),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    unpublish: {
      method: 'POST' as const,
      path: '/api/events/:id/unpublish',
      responses: {
        200: z.object({ message: z.string(), event: eventSchema }),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    cancel: {
      method: 'POST' as const,
      path: '/api/events/:id/cancel',
      responses: {
        200: z.object({ message: z.string(), event: eventSchema }),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
