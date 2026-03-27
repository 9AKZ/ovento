import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, InsertUser, LoginRequest } from "../../shared/schema";
import { api } from "../../shared/routes";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const normalized = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      };
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      const payload = await res.json();
      if (payload?.user) {
        payload.user.bio = payload.user.bio ?? undefined;
        payload.user.avatarUrl = payload.user.avatarUrl ?? undefined;
      }
      return api.auth.login.responses[200].parse(payload);
    },
    onSuccess: (data) => {
      // Tokens are stored in HTTP-only cookies
      queryClient.setQueryData([api.auth.me.path], { user: data.user });
      toast({ title: "Welcome back!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });
}

function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (user: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      const payload = await res.json();
      if (payload?.user) {
        payload.user.bio = payload.user.bio ?? undefined;
        payload.user.avatarUrl = payload.user.avatarUrl ?? undefined;
      }
      return api.auth.register.responses[201].parse(payload);
    },
    onSuccess: (data) => {
      // Tokens are stored in HTTP-only cookies
      queryClient.setQueryData([api.auth.me.path], { user: data.user });
      toast({ title: "Account created", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });
}

function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, { 
        method: api.auth.logout.method,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        }
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.setQueryData([api.auth.me.path], null);
      toast({ title: "Déconnexion réussie", description: "À bientôt!" });
    },
    onError: (error: Error) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(api.auth.me.path, { credentials: "include", headers });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      const payload = await res.json();
      if (payload?.user) {
        payload.user.bio = payload.user.bio ?? undefined;
        payload.user.avatarUrl = payload.user.avatarUrl ?? undefined;
      }
      return api.auth.me.responses[200].parse(payload);
    },
    retry: false,
  });

  const user = data?.user ?? null;
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error | null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
