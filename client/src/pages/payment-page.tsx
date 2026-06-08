import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Lock, CreditCard, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { PendingPaymentSession } from "@/hooks/use-payment";

const _envKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const _stripeKey = (_envKey && (_envKey.startsWith("pk_test_51") || _envKey.startsWith("pk_live_")))
  ? _envKey
  : "pk_test_51TfmluPccfhQWH4SWCSbCy7gbxC092LdiadvSbXQeMgmvD8Ll3Ka582jTpB2WDEdXkoheGr6T1TQCwV5FdGkv0Ch00T6gL1M0o";
const stripePromise = loadStripe(_stripeKey);

// ─── Inner checkout form (needs Stripe context) ───────────────────────────────
function CheckoutForm({ session }: { session: PendingPaymentSession }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message ?? "Le paiement a échoué. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          await fetch(`/api/payments/${session.paymentId}/stripe-confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });
        } catch {
          // Non-blocking
        }
        setSucceeded(true);
        sessionStorage.removeItem("pendingPayment");
        setTimeout(() => {
          setLocation(`/event/${session.eventId}?payment=success`);
        }, 1500);
        return;
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Une erreur inattendue est survenue. Veuillez réessayer.");
    }

    setLoading(false);
  };

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: session.currency,
  }).format(session.amount);

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-14 h-14 text-green-500" />
        <p className="text-xl font-semibold">Paiement réussi !</p>
        <p className="text-muted-foreground text-sm">Redirection vers l'événement…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!stripeReady && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement du formulaire de paiement…</span>
        </div>
      )}
      <PaymentElement
        options={{ layout: "tabs" }}
        onReady={() => setStripeReady(true)}
      />

      {errorMessage && (
        <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold"
        disabled={loading || !stripe || !elements || !stripeReady}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Traitement…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Payer {formattedAmount}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Paiement sécurisé par Stripe. Vos données bancaires ne sont jamais stockées sur nos serveurs.
      </p>
    </form>
  );
}

// ─── Payment page wrapper ─────────────────────────────────────────────────────
export default function PaymentPage() {
  const [, params] = useRoute("/payment/:id");
  const [, setLocation] = useLocation();
  const paymentId = (params as any)?.id ?? "";
  const [session, setSession] = useState<PendingPaymentSession | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingPayment");
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      const data: PendingPaymentSession = JSON.parse(raw);
      if (data.paymentId !== paymentId) {
        setNotFound(true);
        return;
      }
      setSession(data);
    } catch {
      setNotFound(true);
    }
  }, [paymentId]);

  if (notFound) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <p className="text-lg font-semibold">Session de paiement introuvable.</p>
        <p className="text-muted-foreground text-sm">
          Votre session a peut-être expiré. Retournez à l'événement pour recommencer.
        </p>
        <Link href="/">
          <Button variant="outline">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: session.currency,
  }).format(session.amount);

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <Link href={`/event/${session.eventId}`}>
        <Button variant="ghost" className="pl-0 group mb-2">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Retour à l'événement
        </Button>
      </Link>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Finaliser votre inscription</CardTitle>
          </div>
          {session.eventTitle && (
            <CardDescription className="text-base font-medium text-foreground">
              {session.eventTitle}
            </CardDescription>
          )}
          <div className="mt-2 text-2xl font-bold text-primary">{formattedAmount}</div>
        </CardHeader>

        <CardContent>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: session.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#16a34a",
                  borderRadius: "8px",
                },
              },
              locale: "fr",
            }}
          >
            <CheckoutForm session={session} />
          </Elements>
        </CardContent>
      </Card>

    </div>
  );
}
