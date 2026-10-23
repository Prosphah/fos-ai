/**
 * Provider-agnostic payment adapter interface.
 *
 * Paystack and Flutterwave both implement this. Every caller in this codebase
 * talks to the registry instead of importing a provider directly, so flipping
 * PAYMENT_PROVIDER in .env.local swaps the backend underneath checkout,
 * webhooks, verification, and recovery without touching any of them.
 */

export type PaymentProvider = "paystack" | "flutterwave";

export type PaymentInitializeResult = {
  /** The reference the buyer's session is keyed on (Paystack reference or Flutterwave tx_ref). */
  reference: string;
  /** URL the buyer is redirected to in order to pay. */
  authorizationUrl: string;
};

export type PaymentVerifiedTransaction = {
  reference: string;
  status: string;
  amount: number; // minor units (kobo for NGN)
  currency: string;
  email: string;
  /** The provider's customer record, when it carries one. Optional. */
  phone?: string | null;
  paidAt: string | null;
  transactionId: number | null;
  metadata: Record<string, unknown> | null;
};

export type PaymentProviderAdapter = {
  name: PaymentProvider;
  generateReference(): string;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  initializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, string | number | boolean>;
    /** E.164 digits when the buyer supplied one. Optional. */
    phone?: string | null;
  }): Promise<PaymentInitializeResult>;
  verifyTransaction(
    reference: string,
    timeoutMs?: number
  ): Promise<PaymentVerifiedTransaction | null>;
};

export type ResolvedProvider = {
  provider: PaymentProviderAdapter;
  envVar: string;
};
