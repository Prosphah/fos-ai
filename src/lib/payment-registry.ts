/**
 * Payment provider registry — the switch between Paystack and Flutterwave.
 *
 * Set PAYMENT_PROVIDER in .env.local to "paystack" or "flutterwave".
 * Checkout, verification, and recovery all go through getPaymentProvider() and
 * never import a provider module directly, so flipping the env var rewires them
 * together.
 *
 * The two webhook routes are the deliberate exception: each is permanently
 * bound to its own provider, so a webhook from the previous provider that
 * arrives after a switch is still verified and fulfilled. New checkouts follow
 * the env var; old references follow the provider recorded on the row.
 */

import { PaymentProvider, PaymentProviderAdapter } from "@/lib/payment-provider";
import * as paystack from "@/lib/paystack";
import * as flutterwave from "@/lib/flutterwave";

const ADAPTERS: Record<PaymentProvider, PaymentProviderAdapter> = {
  paystack: {
    name: "paystack",
    generateReference: paystack.generateReference,
    verifyWebhookSignature: paystack.verifyWebhookSignature,
    initializeTransaction: paystack.initializeTransaction,
    verifyTransaction: paystack.verifyTransaction,
  },
  flutterwave: {
    name: "flutterwave",
    generateReference: flutterwave.generateReference,
    verifyWebhookSignature: flutterwave.verifyWebhookSignature,
    initializeTransaction: flutterwave.initializeTransaction,
    verifyTransaction: flutterwave.verifyTransaction,
  },
};

function resolveProvider(value: string | undefined): PaymentProvider {
  switch (value) {
    case "paystack":
    case "flutterwave":
      return value;
    default:
      return "paystack";
  }
}

/**
 * Returns the configured provider adapter. Defaults to Paystack when the env
 * var is unset or unrecognised, so existing deployments keep working without
 * any change.
 */
export function getPaymentProvider(): PaymentProviderAdapter {
  return ADAPTERS[resolveProvider(process.env.PAYMENT_PROVIDER)];
}

/**
 * Returns the adapter for a provider name recorded on a row.
 *
 * The recovery sweep must verify each pending checkout against the provider
 * that created it, not the provider currently selected: rows created before a
 * switch would otherwise be sent to an API that has never heard of them.
 * Unknown values fall back to the default, which is what historical rows
 * without a column value carry.
 */
export function getPaymentProviderByName(
  name: string | null | undefined
): PaymentProviderAdapter {
  return ADAPTERS[resolveProvider(name ?? undefined)];
}

/**
 * The provider name in effect, for logging and telemetry.
 */
export function getPaymentProviderName(): PaymentProvider {
  return resolveProvider(process.env.PAYMENT_PROVIDER);
}
