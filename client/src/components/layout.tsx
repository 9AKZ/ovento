import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Calendar,
  User,
  PlusCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: ReactNode; icon: any }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${isActive 
          ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
        {children}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/logo.png"
            alt="Ôvento logo"
            className="w-20 h-20 rounded-lg object-contain"
          />
          <h1 className="text-2xl font-bold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">Ôvento</h1>
        </div>

        <div className="space-y-2">
          <NavLink href="/" icon={Calendar}>Explorer les Événements</NavLink>
          {user && (
            <>
              <NavLink href="/create" icon={PlusCircle}>Créer un Événement</NavLink>
              <NavLink href="/profile" icon={User}>Mon Profil</NavLink>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-border/50">
        {user ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {user.lastLoginAt && (
                  <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                    Dernière connexion : {new Date(user.lastLoginAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Link href="/auth">
              <Button className="w-full bg-gradient-to-r from-primary to-green-600 hover:opacity-90 transition-opacity">
                Connexion / Inscription
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Ôvento logo"
            className="w-12 h-12 rounded-md object-contain"
          />
          <span className="font-bold font-display text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">Ôvento</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden md:ml-0 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
