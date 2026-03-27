import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Define login schema locally since it's just a subset
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

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
      {/* Right Side - Visual Hero (Mobile: First) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="order-2 lg:order-1 hidden lg:flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between items-center">
          <div />
          
          {/* Hero Content */}
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl max-w-xs hover:shadow-3xl transition-all duration-500">
                <div className="relative aspect-square bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80&crop=entropy&cs=tinysrgb" 
                    alt="Event Community" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-display font-bold leading-tight">Rejoignez Notre Communauté</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Trouvez, créez et participez aux événements qui vous passionnent près de chez vous.</p>
            </motion.div>
          </div>

          <div className="flex gap-8 justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <div className="text-2xl font-bold gradient-text">1000+</div>
              <div className="text-xs text-muted-foreground">Événements actifs</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <div className="text-2xl font-bold gradient-text">5000+</div>
              <div className="text-xs text-muted-foreground">Participants</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <div className="text-2xl font-bold gradient-text">50+</div>
              <div className="text-xs text-muted-foreground">Villes</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Left Side - Form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="order-1 lg:order-2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background"
      >
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bienvenue</span>
            </motion.div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Explorez
              <br />
              <span className="gradient-text">les Meilleurs Événements</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connectez-vous avec des personnes passionnées et vivez des expériences inoubliables.
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
                        className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all border-0 rounded-lg"
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
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all border-0 rounded-lg"
                        disabled={registerMutation.isPending}
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
      </motion.div>
    </div>
  );
}
