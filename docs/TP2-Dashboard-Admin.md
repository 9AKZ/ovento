# 📊 TP2 : Tableau de Bord Administrateur

## Objectifs du TP

À la fin de ce TP, vous serez capable de :
- ✅ Créer une interface d'administration complète
- ✅ Afficher des statistiques avec des graphiques
- ✅ Gérer les utilisateurs (liste, rôles, suppression)
- ✅ Gérer tous les événements de la plateforme
- ✅ Protéger les routes admin

**Durée estimée** : 4 heures  
**Niveau** : ⭐⭐⭐ Avancé

---

## 📚 Prérequis

- Avoir terminé le TP1
- Avoir un compte avec le rôle "ADMIN"
- Comprendre les bases de React et des hooks

---

## 🎯 Partie 1 : Créer les Routes Backend Admin

### Étape 1.1 : Créer le contrôleur Admin

**Fichier à créer** : `AdelBackend-main/src/controllers/AdminController.js`

```javascript
// AdelBackend-main/src/controllers/AdminController.js

import { User, Event, Inscription, Payment } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class AdminController {
  /**
   * Obtenir les statistiques globales
   * GET /api/admin/stats
   */
  async getStats(req, res, next) {
    try {
      // Compter les utilisateurs
      const totalUsers = await User.count();
      const usersByRole = await User.findAll({
        attributes: ['role'],
        group: ['role'],
        raw: true,
      });

      // Compter les événements
      const totalEvents = await Event.count();
      const eventsByStatus = await Event.findAll({
        attributes: ['status'],
        group: ['status'],
        raw: true,
      });

      // Compter les inscriptions
      const totalInscriptions = await Inscription.count();

      // Événements récents (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentEvents = await Event.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo,
          },
        },
      });

      // Nouveaux utilisateurs (7 derniers jours)
      const recentUsers = await User.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo,
          },
        },
      });

      res.json({
        users: {
          total: totalUsers,
          byRole: usersByRole,
          recentWeek: recentUsers,
        },
        events: {
          total: totalEvents,
          byStatus: eventsByStatus,
          recentWeek: recentEvents,
        },
        inscriptions: {
          total: totalInscriptions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les utilisateurs
   * GET /api/admin/users
   */
  async listUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const offset = (page - 1) * limit;

      // Construire les conditions de recherche
      const where = {};
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { full_name: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: ['id', 'email', 'full_name', 'role', 'is_verified', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        users: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modifier le rôle d'un utilisateur
   * PATCH /api/admin/users/:id/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Vérifier que le rôle est valide
      const validRoles = ['USER', 'ORGANIZER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Rôle invalide',
          code: 'INVALID_ROLE',
        });
      }

      // Trouver l'utilisateur
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
        });
      }

      // Empêcher de modifier son propre rôle
      if (user.id === req.userId) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas modifier votre propre rôle',
          code: 'CANNOT_MODIFY_SELF',
        });
      }

      // Mettre à jour le rôle
      await user.update({ role });

      logger.info(`Admin ${req.userId} changed role of user ${id} to ${role}`);

      res.json({
        message: 'Rôle mis à jour avec succès',
        user: user.toPublicJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un utilisateur
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND',
        });
      }

      // Empêcher de se supprimer soi-même
      if (user.id === req.userId) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas supprimer votre propre compte',
          code: 'CANNOT_DELETE_SELF',
        });
      }

      await user.destroy();

      logger.info(`Admin ${req.userId} deleted user ${id}`);

      res.json({
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les événements (admin)
   * GET /api/admin/events
   */
  async listAllEvents(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { location: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Event.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id', 'full_name', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        events: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
```

### Étape 1.2 : Créer les routes Admin

**Fichier à créer** : `AdelBackend-main/src/routes/admin.routes.js`

```javascript
// AdelBackend-main/src/routes/admin.routes.js

import { Router } from 'express';
import AdminController from '../controllers/AdminController.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = Router();

// Toutes les routes admin nécessitent authentification + rôle ADMIN
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Obtenir les statistiques globales
 * @access Admin
 */
router.get('/stats', AdminController.getStats);

/**
 * @route GET /api/admin/users
 * @desc Lister tous les utilisateurs
 * @access Admin
 */
router.get('/users', AdminController.listUsers);

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Modifier le rôle d'un utilisateur
 * @access Admin
 */
router.patch('/users/:id/role', AdminController.updateUserRole);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Supprimer un utilisateur
 * @access Admin
 */
router.delete('/users/:id', AdminController.deleteUser);

/**
 * @route GET /api/admin/events
 * @desc Lister tous les événements
 * @access Admin
 */
router.get('/events', AdminController.listAllEvents);

export default router;
```

### Étape 1.3 : Enregistrer les routes

**Fichier à modifier** : `AdelBackend-main/src/routes/index.js`

Ajoutez l'import et la route :

```javascript
// Ajouter en haut du fichier
import adminRoutes from './admin.routes.js';

// Ajouter avec les autres routes
router.use('/admin', adminRoutes);
```

---

## 🎨 Partie 2 : Créer l'Interface Admin (Frontend)

### Étape 2.1 : Créer le hook useAdmin

**Fichier à créer** : `client/src/hooks/use-admin.ts`

```typescript
// client/src/hooks/use-admin.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types
type UserRole = "USER" | "ORGANIZER" | "ADMIN";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
};

type Stats = {
  users: {
    total: number;
    byRole: { role: string; count: number }[];
    recentWeek: number;
  };
  events: {
    total: number;
    byStatus: { status: string; count: number }[];
    recentWeek: number;
  };
  inscriptions: {
    total: number;
  };
};

// Hook pour les statistiques
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async (): Promise<Stats> => {
      const res = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des statistiques");
      return res.json();
    },
  });
}

// Hook pour la liste des utilisateurs
export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [key, val]) => {
      if (val !== undefined) acc[key] = String(val);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: ["admin", "users", queryString],
    queryFn: async () => {
      const url = `/api/admin/users${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs");
      return res.json();
    },
  });
}

// Hook pour modifier le rôle d'un utilisateur
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la modification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Succès", description: "Rôle mis à jour" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Succès", description: "Utilisateur supprimé" });
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

// Hook pour la liste des événements (admin)
export function useAdminEvents(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [key, val]) => {
      if (val !== undefined) acc[key] = String(val);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: ["admin", "events", queryString],
    queryFn: async () => {
      const url = `/api/admin/events${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des événements");
      return res.json();
    },
  });
}
```

### Étape 2.2 : Créer le composant StatCard

**Fichier à créer** : `client/src/components/admin/StatCard.tsx`

```tsx
// client/src/components/admin/StatCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-white border-beige-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-bordeaux-600 mt-1">{value}</p>
            {description && (
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            )}
            {trend && (
              <p
                className={`text-sm mt-2 ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value} cette semaine
              </p>
            )}
          </div>
          <div className="p-4 bg-beige-100 rounded-full">
            <Icon className="w-8 h-8 text-bordeaux-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Étape 2.3 : Créer le composant UsersTable

**Fichier à créer** : `client/src/components/admin/UsersTable.tsx`

```tsx
// client/src/components/admin/UsersTable.tsx

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, Shield, User, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUpdateUserRole, useDeleteUser } from "@/hooks/use-admin";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
  is_verified: boolean;
  created_at: string;
};

type UsersTableProps = {
  users: User[];
};

const roleLabels = {
  USER: { label: "Utilisateur", color: "bg-gray-100 text-gray-800" },
  ORGANIZER: { label: "Organisateur", color: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Admin", color: "bg-bordeaux-100 text-bordeaux-800" },
};

export function UsersTable({ users }: UsersTableProps) {
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const updateRoleMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUser();

  const handleRoleChange = (userId: string, newRole: "USER" | "ORGANIZER" | "ADMIN") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-beige-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-beige-50">
            <TableRow>
              <TableHead className="font-semibold text-bordeaux-700">Nom</TableHead>
              <TableHead className="font-semibold text-bordeaux-700">Email</TableHead>
              <TableHead className="font-semibold text-bordeaux-700">Rôle</TableHead>
              <TableHead className="font-semibold text-bordeaux-700">Vérifié</TableHead>
              <TableHead className="font-semibold text-bordeaux-700">Inscrit le</TableHead>
              <TableHead className="font-semibold text-bordeaux-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-beige-50">
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={roleLabels[user.role].color}>
                    {roleLabels[user.role].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.is_verified ? (
                    <Badge className="bg-green-100 text-green-800">Oui</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Non</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Changer le rôle */}
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "USER")}
                        disabled={user.role === "USER"}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Définir comme Utilisateur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "ORGANIZER")}
                        disabled={user.role === "ORGANIZER"}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Définir comme Organisateur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, "ADMIN")}
                        disabled={user.role === "ADMIN"}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Définir comme Admin
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Supprimer */}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{userToDelete?.full_name}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Étape 2.4 : Créer la page Admin Dashboard

**Fichier à créer** : `client/src/pages/admin-dashboard-page.tsx`

```tsx
// client/src/pages/admin-dashboard-page.tsx

import { useState } from "react";
import { Users, Calendar, UserCheck, TrendingUp, Search } from "lucide-react";
import { useAdminStats, useAdminUsers, useAdminEvents } from "@/hooks/use-admin";
import { StatCard } from "@/components/admin/StatCard";
import { UsersTable } from "@/components/admin/UsersTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [userPage, setUserPage] = useState(1);

  // Récupérer les données
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    page: userPage,
    limit: 10,
    role: userRole || undefined,
    search: userSearch || undefined,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-bordeaux-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-bordeaux-700">
            Tableau de Bord Admin
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les utilisateurs et les événements de la plateforme
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Utilisateurs"
            value={stats?.users.total || 0}
            icon={Users}
            trend={{
              value: stats?.users.recentWeek || 0,
              isPositive: true,
            }}
          />
          <StatCard
            title="Événements"
            value={stats?.events.total || 0}
            icon={Calendar}
            trend={{
              value: stats?.events.recentWeek || 0,
              isPositive: true,
            }}
          />
          <StatCard
            title="Inscriptions"
            value={stats?.inscriptions.total || 0}
            icon={UserCheck}
          />
          <StatCard
            title="Taux de participation"
            value={
              stats?.events.total
                ? `${Math.round((stats.inscriptions.total / stats.events.total) * 10)}%`
                : "0%"
            }
            icon={TrendingUp}
          />
        </div>

        {/* Onglets */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white border border-beige-200">
            <TabsTrigger value="users" className="data-[state=active]:bg-bordeaux-500 data-[state=active]:text-white">
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-bordeaux-500 data-[state=active]:text-white">
              Événements
            </TabsTrigger>
          </TabsList>

          {/* Onglet Utilisateurs */}
          <TabsContent value="users" className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border border-beige-200">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 border-beige-200"
                />
              </div>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-full md:w-48 border-beige-200">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les rôles</SelectItem>
                  <SelectItem value="USER">Utilisateurs</SelectItem>
                  <SelectItem value="ORGANIZER">Organisateurs</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table des utilisateurs */}
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-bordeaux-500" />
              </div>
            ) : (
              <>
                <UsersTable users={usersData?.users || []} />
                
                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                    >
                      Précédent
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Page {userPage} sur {usersData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setUserPage((p) => p + 1)}
                      disabled={userPage >= usersData.totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Onglet Événements */}
          <TabsContent value="events">
            <div className="bg-white p-6 rounded-lg border border-beige-200">
              <p className="text-gray-500 text-center py-8">
                La gestion des événements sera implémentée dans un prochain TP.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### Étape 2.5 : Ajouter la route dans App.tsx

**Fichier à modifier** : `client/src/App.tsx`

Ajoutez l'import et la route :

```tsx
// Ajouter l'import
import AdminDashboardPage from "@/pages/admin-dashboard-page";

// Ajouter la route (dans le Switch, après les autres routes protégées)
<Route path="/admin">
  <Layout>
    <ProtectedRoute component={AdminDashboardPage} />
  </Layout>
</Route>
```

---

## 🧪 Partie 3 : Exercices Pratiques

### Exercice 1 : Ajouter un graphique

**Objectif** : Afficher un graphique des inscriptions par jour sur les 7 derniers jours.

**Instructions** :
1. Installez `recharts` : `npm install recharts`
2. Créez un composant `InscriptionsChart.tsx`
3. Utilisez le composant `LineChart` de recharts

### Exercice 2 : Gestion des événements admin

**Objectif** : Compléter l'onglet "Événements" du dashboard admin.

**Instructions** :
1. Créez un composant `EventsTable.tsx` similaire à `UsersTable`
2. Ajoutez la possibilité de changer le statut d'un événement
3. Ajoutez la suppression d'un événement

### Exercice 3 : Export CSV

**Objectif** : Permettre d'exporter la liste des utilisateurs en CSV.

**Instructions** :
1. Créez une fonction `exportToCSV(users)`
2. Ajoutez un bouton "Exporter" dans l'interface
3. Générez et téléchargez le fichier CSV

---

## ✅ Checklist de Validation

- [ ] Les routes backend admin fonctionnent
- [ ] Les statistiques s'affichent correctement
- [ ] La liste des utilisateurs s'affiche avec pagination
- [ ] Le changement de rôle fonctionne
- [ ] La suppression d'utilisateur fonctionne avec confirmation
- [ ] L'interface est responsive

---

**Bravo ! Vous avez terminé le TP2 ! 🎉**

Passez maintenant au [TP3 : Tableau de Bord Utilisateur](./TP3-Dashboard-User.md)
