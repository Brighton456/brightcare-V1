const DEFAULT_ENDPOINT = "https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-pay";
const DEFAULT_STATUS = "https://ftwbfezbikovfzfbxvnn.supabase.co/functions/v1/endpoint-status";
const DEFAULT_API_KEY = "bp_ep_d2d888b5778b06b8";

// Allow overriding endpoint and key per-hospital
let _endpoint = DEFAULT_ENDPOINT;
let _statusEndpoint = DEFAULT_STATUS;
let _apiKey = DEFAULT_API_KEY;

export function configureMpesa(opts: { endpoint?: string; statusEndpoint?: string; apiKey?: string }) {
  if (opts.endpoint) _endpoint = opts.endpoint;
  if (opts.statusEndpoint) _statusEndpoint = opts.statusEndpoint;
  if (opts.apiKey) _apiKey = opts.apiKey;
}

export function getMpesaConfig() {
  return { endpoint: _endpoint, statusEndpoint: _statusEndpoint, apiKey: _apiKey };
}

export interface MpesaPaymentRequest {
  amount: number;
  phone_number: string;
  external_reference: string;
}

export interface MpesaInitResponse {
  success: boolean;
  transaction_id?: string;
  checkout_id?: string;
  error?: string;
}

export interface MpesaStatusResponse {
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount?: number;
  mpesa_receipt?: string;
  error?: string;
}

export async function initiateMpesaPayment(req: MpesaPaymentRequest): Promise<MpesaInitResponse> {
  const res = await fetch(_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": _apiKey },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Payment initiation failed: ${err}`);
  }
  return res.json();
}

export async function checkMpesaStatus(checkoutId: string): Promise<MpesaStatusResponse> {
  const res = await fetch(`${_statusEndpoint}?checkout_id=${checkoutId}`, {
    headers: { "x-api-key": _apiKey },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Status check failed: ${err}`);
  }
  return res.json();
}

export function pollMpesaStatus(
  checkoutId: string,
  onUpdate: (status: MpesaStatusResponse) => void,
  onComplete: (status: MpesaStatusResponse) => void,
  onError: (error: Error) => void,
  intervalMs = 3000,
  maxAttempts = 40
): () => void {
  let attempts = 0;
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    attempts++;
    try {
      const status = await checkMpesaStatus(checkoutId);
      onUpdate(status);
      if (status.status === "COMPLETED" || status.status === "FAILED") {
        onComplete(status);
        return;
      }
      if (attempts >= maxAttempts) {
        onError(new Error("Payment verification timed out. Please check manually."));
        return;
      }
      setTimeout(poll, intervalMs);
    } catch (err) {
      if (!cancelled) onError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  poll();
  return () => { cancelled = true; };
}

export function generateReference(prefix = "BSC"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
