import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie_consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          Ce site utilise des cookies strictement nécessaires à son fonctionnement (authentification).
          Aucun cookie publicitaire ou de tracking n'est utilisé.{" "}
          <Link href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-foreground transition-colors">
            En savoir plus
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={refuse} className="text-xs h-8">
            Refuser
          </Button>
          <Button size="sm" onClick={accept} className="text-xs h-8">
            Accepter
          </Button>
          <button onClick={refuse} className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
