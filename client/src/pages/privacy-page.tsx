import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <Link href="/">
        <Button variant="ghost" className="pl-0 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
        <p className="text-muted-foreground text-sm">Dernière mise à jour : juin 2026</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Qui sommes-nous ?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ôvento est une plateforme de gestion et de découverte d'événements. Le responsable du traitement
            des données est l'équipe Ôvento, joignable à l'adresse :{" "}
            <a href="mailto:contact@ovento.fr" className="underline hover:text-foreground">contact@ovento.fr</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Quelles données collectons-nous ?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Lors de la création d'un compte, nous collectons votre nom, votre adresse e-mail et un mot de passe chiffré.
            Lors d'une inscription à un événement payant, les informations de paiement sont traitées directement par
            Stripe — nous ne stockons aucune donnée bancaire sur nos serveurs.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nous conservons également les données liées à votre activité sur la plateforme : événements créés,
            inscriptions aux événements, et historique des paiements (montant, date, statut).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Pourquoi traitons-nous ces données ?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><span className="text-foreground font-medium">Fonctionnement du service</span> — authentification, gestion des inscriptions et des événements.</li>
            <li><span className="text-foreground font-medium">Paiements</span> — traitement des transactions pour les événements payants.</li>
            <li><span className="text-foreground font-medium">Communication</span> — confirmation d'inscription et récapitulatifs de paiement par e-mail.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Ces traitements reposent sur l'exécution du contrat qui nous lie à vous lorsque vous utilisez nos services.
            Nous n'utilisons pas vos données à des fins publicitaires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Combien de temps conservons-nous vos données ?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Vos données de compte sont conservées tant que votre compte est actif. En cas de suppression du compte,
            l'ensemble des données personnelles est supprimé dans un délai de 30 jours, à l'exception des données
            nécessaires au respect d'obligations légales (notamment les données de facturation, conservées 10 ans conformément
            au code de commerce).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous utilisons uniquement des cookies techniques strictement nécessaires au fonctionnement du site,
            notamment pour maintenir votre session de connexion. Aucun cookie publicitaire ni de suivi tiers n'est déposé.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Vos droits</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><span className="text-foreground font-medium">Droit d'accès</span> — obtenir une copie des données vous concernant.</li>
            <li><span className="text-foreground font-medium">Droit de rectification</span> — corriger des données inexactes.</li>
            <li><span className="text-foreground font-medium">Droit à l'effacement</span> — demander la suppression de vos données via votre profil ou par e-mail.</li>
            <li><span className="text-foreground font-medium">Droit à la portabilité</span> — recevoir vos données dans un format structuré.</li>
            <li><span className="text-foreground font-medium">Droit d'opposition</span> — vous opposer à certains traitements.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@ovento.fr" className="underline hover:text-foreground">contact@ovento.fr</a>.
            Vous pouvez également introduire une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">www.cnil.fr</a>).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Sous-traitants</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous faisons appel à Stripe pour le traitement des paiements. Stripe est certifié PCI-DSS et opère conformément
            au RGPD. Aucune autre donnée personnelle n'est transmise à des tiers sans votre consentement.
          </p>
        </section>

      </div>
    </div>
  );
}
