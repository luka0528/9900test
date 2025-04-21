// hooks/useMakePayment.ts
import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export function useMakePayment() {
  // these are now valid hook calls
  const processPayment =
    api.subscription.createStripePaymentIntent.useMutation();
  const cancelPayment =
    api.subscription.cancelStripePaymentIntent.useMutation();

  const makePayment = useCallback(
    async (selectedTier: string, selectedPaymentMethod: string) => {
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      );
      if (!selectedTier || !selectedPaymentMethod || !stripe) {
        return false;
      }

      try {
        // 1) create the intent
        const paymentResponse = await processPayment.mutateAsync({
          paymentMethodId: selectedPaymentMethod,
          subscriptionTierId: selectedTier,
        });

        // 2) handle non‑success statuses
        if (!paymentResponse.success) {
          toast.error(`Error: ${paymentResponse.message}`);
          switch (paymentResponse.status) {
            case "CONFIRMATION_REQUIRED":
              if (paymentResponse.data?.client_secret) {
                const { paymentIntent: confirmed } =
                  await stripe.confirmCardPayment(
                    paymentResponse.data.client_secret,
                  );
                if (confirmed?.status === "succeeded") {
                  toast.success("Payment confirmed successfully.");
                  break;
                }
              }
              // fallback cancel on failure
              await cancelPayment.mutateAsync({
                paymentIntentId: paymentResponse.data?.client_secret ?? "",
              });
              toast.error("Payment confirmation failed.");
              return false;

            case "RETRY_PAYMENT":
              return false;
            case "FAILED":
              return false;
          }
        } else {
          toast.success("Payment processed successfully.");
        }

        return true;
      } catch (err) {
        console.error("Error processing payment:", err);
        toast.error("Error processing payment.");
        return false;
      }
    },
    [processPayment, cancelPayment],
  );

  return {
    makePayment,
    isLoading: processPayment.isPending || cancelPayment.isPending,
    error: processPayment.error ?? cancelPayment.error,
  };
}
