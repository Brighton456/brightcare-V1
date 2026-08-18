import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // API key authentication
    const apiKey = req.headers.get("x-api-key");
    const validApiKey = Deno.env.get("MPESA_API_KEY");
    if (validApiKey && apiKey !== validApiKey) {
      return json({ error: "Invalid API key" }, 401);
    }

    const url = new URL(req.url);
    const checkoutId = url.searchParams.get("checkout_id");

    if (!checkoutId) {
      return json({ error: "checkout_id is required" }, 400);
    }

    // Safaricom Daraja API credentials
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");

    if (!consumerKey || !consumerSecret) {
      return json({ error: "M-Pesa API credentials not configured" }, 500);
    }

    // Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${authString}` },
    });

    if (!tokenRes.ok) {
      return json({ error: "Failed to authenticate with M-Pesa API" }, 502);
    }

    const { access_token } = await tokenRes.json();

    // Query STK Push status
    const statusRes = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        CheckoutRequestID: checkoutId,
      }),
    });

    const statusData = await statusRes.json();
    console.log("STK Status response:", JSON.stringify(statusData));

    // Map Safaricom response codes to our status
    let status: "PENDING" | "COMPLETED" | "FAILED" = "PENDING";
    let mpesaReceipt = "";

    switch (statusData.ResultCode) {
      case "0":
        status = "COMPLETED";
        mpesaReceipt = statusData.MpesaReceiptNumber || "";
        break;
      case "1032":
      case "1037":
        status = "PENDING"; // Still waiting for user input
        break;
      case "1":
      case "1039":
      case "2001":
        status = "FAILED";
        break;
      default:
        if (statusData.ResultCode && statusData.ResultCode !== "0") {
          status = "FAILED";
        }
        break;
    }

    return json({
      status,
      amount: statusData.amount ? parseFloat(statusData.amount) : undefined,
      mpesa_receipt: mpesaReceipt,
      error: status === "FAILED" ? (statusData.ResultDesc || "Payment failed") : undefined,
    });
  } catch (e) {
    console.error("Error:", e);
    return json({ error: e.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
