import Stripe from "stripe";

let stripe: Stripe;

export function getStripeInstance() {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Stripe key is missing.");
    }

    stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }

  return stripe;
}
