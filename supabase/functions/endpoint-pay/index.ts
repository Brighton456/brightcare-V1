import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { amount, phone_number, external_reference } = await req.json();

    if (!amount || !phone_number) {
      return json({ error: "amount and phone_number are required" }, 400);
    }

    // Safaricom Daraja API credentials
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");

    if (!consumerKey || !consumerSecret) {
      return json({ error: "M-Pesa API credentials not configured" }, 500);
    }

    // Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${authString}` },
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("OAuth error:", errText);
      return json({ error: "Failed to authenticate with M-Pesa API" }, 502);
    }

    const { access_token } = await tokenRes.json();

    // Generate password
    const timestamp = new Date().toISOString().replace(/[-T:Z.]/g, "").substring(0, 14);
    const password = btoa(`${shortcode}${timestamp}${passkey}`);

    // Initiate STK Push
    const stkRes = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone_number,
        PartyB: shortcode,
        PhoneNumber: phone_number,
        CallBackURL: callbackUrl || `${Deno.env.get("SUPABASE_URL")}/functions/v1/endpoint-pay-callback`,
        AccountReference: external_reference || `BSC-${Date.now()}`,
        TransactionDesc: `Payment of KES ${amount}`,
      }),
    });

    const stkData = await stkRes.json();
    console.log("STK Push response:", JSON.stringify(stkData));

    if (stkData.ResponseCode === "0") {
      return json({
        success: true,
        transaction_id: stkData.MerchantRequestID,
        checkout_id: stkData.CheckoutRequestID,
      });
    } else {
      return json({
        success: false,
        error: stkData.ResponseDescription || "STK Push failed",
      });
    }
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
