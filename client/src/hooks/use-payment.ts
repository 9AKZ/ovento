import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface PaymentInitResponse {
  paymentId: string;
  amount: number;
  currency: string;
  clientSecret: string | null;
  status: string;
}

export interface PendingPaymentSession {
  paymentId: string;
  eventId: string;
  amount: number;
  currency: string;
  clientSecret: string;
  eventTitle?: string;
}

export function useInitializePayment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string): Promise<PaymentInitResponse> => {
      const res = await apiRequest("POST", `/api/events/${eventId}/payments`);
      return await res.json();
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
}

export function usePaymentStatus(paymentId: string | null) {
  return useQuery({
    queryKey: ["payment-status", paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/${paymentId}/status`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Impossible de récupérer le statut du paiement");
      return (await res.json()) as {
        payment: { id: string; status: string; amount: number | string; currency: string };
      };
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const status = query.state.data?.payment?.status;
      return status === "PENDING" ? 3000 : false;
    },
  });
}
