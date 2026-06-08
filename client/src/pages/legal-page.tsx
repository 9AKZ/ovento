import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <Link href="/">
        <Button variant="ghost" className="pl-0 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mentions légales</h1>
        <p className="text-muted-foreground text-sm">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.</p>
      </div>

      <div className="space-y-8 text-foreground">

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Éditeur du site</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ôvento est un projet développé dans le cadre d'une formation BTS SIO option SLAM.<br />
            Contact : <a href="mailto:contact@ovento.fr" className="underline hover:text-foreground">contact@ovento.fr</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Hébergement</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ce site est hébergé localement à des fins de démonstration dans le cadre d'un projet pédagogique.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
          <p className="text-muted-foreground leading-relaxed">
            L'ensemble des contenus présents sur ce site (textes, images, code source) sont la propriété de leurs
            auteurs respectifs. Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Données personnelles</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pour toute question relative au traitement de vos données personnelles, consultez notre{" "}
            <Link href="/politique-de-confidentialite" className="underline hover:text-foreground">politique de confidentialité</Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
