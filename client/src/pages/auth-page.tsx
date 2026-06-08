import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "../../shared/schema";
import { Loader2 } from "lucide-react";

// Define login schema locally since it's just a subset
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { email: "", password: "", fullName: "", role: "USER" },
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 gap-8 lg:gap-0">
      {/* Left Side - Brand panel */}
      <div className="order-2 lg:order-1 hidden lg:flex flex-col justify-center items-center p-8 lg:p-12 bg-muted/30 border-r border-border/40">
        <div className="space-y-4 text-center max-w-xs">
          <h2 className="text-3xl font-display font-bold">Ovento</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Plateforme de gestion d'événements. Créez, gérez et participez aux événements près de chez vous.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="order-1 lg:order-2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Bienvenue</h1>
            <p className="text-muted-foreground text-sm">
              Connectez-vous à votre compte ou créez-en un nouveau.
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Connexion</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data as any))} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="vous@exemple.com" {...field} className="h-11 bg-background/50 border-border/40 focus:ring-primary/30 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Mot de passe</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-border/40 focus:ring-primary/30 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 rounded-lg"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</>
                        ) : "Se connecter"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Nom complet</FormLabel>
                            <FormControl>
                              <Input placeholder="Jean Dupont" {...field} className="h-11 bg-background/50 border-border/40 focus:ring-primary/30 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="vous@exemple.com" {...field} className="h-11 bg-background/50 border-border/40 focus:ring-primary/30 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Mot de passe</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-background/50 border-border/40 focus:ring-primary/30 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="consent"
                          checked={consentAccepted}
                          onChange={e => setConsentAccepted(e.target.checked)}
                          className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                        />
                        <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                          J'ai lu et j'accepte la{" "}
                          <Link href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-foreground transition-colors">
                            politique de confidentialité
                          </Link>
                        </label>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 rounded-lg"
                        disabled={registerMutation.isPending || !consentAccepted}
                      >
                        {registerMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>
                        ) : "Créer un compte"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
