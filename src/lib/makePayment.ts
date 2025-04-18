import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export const makePayment = async (
  selectedTier: string,
  selectedPaymentMethod: string,
): Promise<boolean> => {
  const stripe = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  const processPayment =
    api.subscription.createStripePaymentIntent.useMutation();
  const cancelPaymentMutation =
    api.subscription.cancelStripePaymentIntent.useMutation();

  if (!selectedTier || !selectedPaymentMethod || !stripe) {
    return false;
  }

  try {
    // process payment
    const paymentResponse = await processPayment.mutateAsync({
      paymentMethodId: selectedPaymentMethod,
      subscriptionTierId: selectedTier,
    });

    if (!paymentResponse.success) {
      toast.error(`Error: ${paymentResponse.message}`);
      switch (paymentResponse.status) {
        case "CONFIRMATION_REQUIRED":
          toast.error("Payment confirmation required.");
          if (paymentResponse?.data.client_secret) {
            const { paymentIntent: confirmPaymentIntent } =
              await stripe.confirmCardPayment(
                paymentResponse.data.client_secret,
              );
            if (confirmPaymentIntent?.status === "succeeded") {
              toast.success("Payment confirmed successfully.");
              break;
            } else {
              await cancelPaymentMutation.mutateAsync({
                paymentIntentId: confirmPaymentIntent?.id ?? "",
              });
              toast.error("Payment confirmation failed.");
              return false;
            }
          } else {
            toast.error("Error confirming payment.");
            return false;
          }

        case "RETRY_PAYMENT":
          return false;
      }
    } else {
      toast.success("Payment processed successfully.");
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    toast.error("Error processing payment.");
    return false;
  }
  return true;
};
