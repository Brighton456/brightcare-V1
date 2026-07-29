import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { configureMpesa, initiateMpesaPayment, pollMpesaStatus, generateReference, type MpesaStatusResponse } from "@/utils/mpesa";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { useHospital } from "@/contexts/HospitalContext";
import { Phone, Loader2, CheckCircle2, XCircle, Clock, Smartphone, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  amount: number;
  reference?: string;
  onSuccess?: (receipt: string, transactionId: string) => void;
  onFail?: (error: string) => void;
}

type Step = "input" | "sending" | "polling" | "success" | "failed";

export function MpesaPaymentModal({ open, onClose, amount, reference, onSuccess, onFail }: Props) {
  const { hospitalId } = useHospital();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [statusMsg, setStatusMsg] = useState("");
  const [mpesaReceipt, setMpesaReceipt] = useState("");
  const [pollProgress, setPollProgress] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const cancelPollRef = useRef<(() => void) | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setStep("input");
      setPhone("");
      setStatusMsg("");
      setMpesaReceipt("");
      setPollProgress(0);
      setPollCount(0);
      // Load M-Pesa config from hospital settings
      if (hospitalId) {
        supabase.from("hospitals").select("settings").eq("id", hospitalId).single().then(({ data }) => {
          const s = (data as any)?.settings || {};
          if (s.mpesa_api_key) {
            configureMpesa({
              endpoint: s.mpesa_endpoint || undefined,
              statusEndpoint: s.mpesa_status_endpoint || undefined,
              apiKey: s.mpesa_api_key,
            });
          }
        });
      }
    }
    return () => {
      cancelPollRef.current?.();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [open, hospitalId]);

  const startProgressAnimation = useCallback(() => {
    setPollProgress(0);
    setPollCount(0);
    let progress = 0;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      progress += 0.83; // ~100% over 120s
      setPollProgress(Math.min(progress, 98));
      setPollCount(prev => prev + 1);
    }, 1000);
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const handlePay = useCallback(async () => {
    let cleaned = phone.replace(/[\s\-+]/g, "");
    // Normalize phone: 07... → 2547..., 01... → 2541...
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      cleaned = "254" + cleaned.substring(1);
    } else if (!cleaned.startsWith("254") && cleaned.length >= 9) {
      cleaned = "254" + cleaned;
    }
    if (!cleaned || cleaned.length < 12 || !cleaned.startsWith("254")) {
      toast({ title: "Invalid phone", description: "Enter a valid M-Pesa number (e.g. 0712345678 or 254712345678)", variant: "destructive" });
      return;
    }
    setStep("sending");
    setStatusMsg("Initiating payment...");
    try {
      const ref = reference || generateReference();
      const res = await initiateMpesaPayment({ amount, phone_number: cleaned, external_reference: ref });
      if (!res.success || !res.checkout_id) {
        setStep("failed");
        setStatusMsg(res.error || "Failed to initiate payment. Please check M-Pesa API configuration in Platform Admin.");
        return;
      }
      // Start polling
      setStep("polling");
      setStatusMsg("STK Push sent! Check your phone for the M-Pesa prompt...");
      startProgressAnimation();

      const cancel = pollMpesaStatus(
        res.checkout_id,
        (s: MpesaStatusResponse) => {
          if (s.status === "PENDING") {
            setStatusMsg("Waiting for you to enter your M-Pesa PIN...");
          }
        },
        (s: MpesaStatusResponse) => {
          stopProgressAnimation();
          if (s.status === "COMPLETED") {
            setPollProgress(100);
            setStep("success");
            setMpesaReceipt(s.mpesa_receipt || "");
            setStatusMsg("Payment confirmed successfully!");
            onSuccess?.(s.mpesa_receipt || "", ref);
          } else {
            setStep("failed");
            setStatusMsg("Payment was not completed. The request may have been cancelled or timed out.");
            onFail?.("Payment failed or was cancelled");
          }
        },
        (err: Error) => {
          stopProgressAnimation();
          setStep("failed");
          setStatusMsg(err.message);
          onFail?.(err.message);
        },
        3000,
        40
      );
      cancelPollRef.current = cancel;
    } catch (err: any) {
      setStep("failed");
      setStatusMsg(err.message || "Network error. Check your connection and try again.");
    }
  }, [phone, amount, reference, onSuccess, onFail, toast, startProgressAnimation, stopProgressAnimation]);

  const handleCancel = () => {
    cancelPollRef.current?.();
    stopProgressAnimation();
    onClose();
  };

  const pollingMessages = [
    "Connecting to M-Pesa...",
    "STK Push sent to your phone...",
    "Waiting for PIN entry...",
    "Processing payment...",
    "Almost there...",
  ];

  const getPollingPhase = () => {
    if (pollCount < 3) return 0;
    if (pollCount < 8) return 1;
    if (pollCount < 20) return 2;
    if (pollCount < 35) return 3;
    return 4;
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Green header bar */}
        <div className="bg-success px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-success-foreground text-lg">
            <Smartphone className="h-6 w-6" />
            <span className="font-black tracking-wide">M-PESA</span>
            <span className="font-normal text-success-foreground/80">Payment</span>
          </DialogTitle>
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* Amount display */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-4xl font-black text-foreground tracking-tight">
              KES {amount.toLocaleString()}
            </p>
          </div>

          {/* INPUT step */}
          {step === "input" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">M-Pesa Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="0712345678 or 254712345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="pl-10 text-lg text-center font-mono h-12"
                    onKeyDown={e => e.key === "Enter" && handlePay()}
                    autoFocus
                  />
                </div>
              </div>
              <Button onClick={handlePay} className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold text-base py-6 gap-2">
                <Smartphone className="h-5 w-5" />
                Send STK Push
              </Button>
              <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" /> Secure payment via Safaricom M-Pesa
              </p>
            </div>
          )}

          {/* SENDING step */}
          {step === "sending" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-success/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-success animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">{statusMsg}</p>
            </div>
          )}

          {/* POLLING step - animated */}
          {step === "polling" && (
            <div className="space-y-5 py-2">
              {/* Animated phone icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center animate-pulse">
                    <Smartphone className="h-10 w-10 text-success" />
                  </div>
                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
                  <div className="absolute -inset-2 rounded-full border border-success/15 animate-ping" style={{ animationDelay: "0.5s" }} />
                </div>
              </div>

              {/* Status text */}
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {pollingMessages[getPollingPhase()]}
                </p>
                <p className="text-xs text-muted-foreground">{statusMsg}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={pollProgress} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Waiting for confirmation</span>
                  <span>{Math.round(pollProgress)}%</span>
                </div>
              </div>

              {/* Animated dots */}
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-success"
                    style={{
                      animation: "pulse 1.5s ease-in-out infinite",
                      animationDelay: `${i * 0.3}s`,
                      opacity: 0.3,
                    }}
                  />
                ))}
              </div>

              <p className="text-[11px] text-center text-muted-foreground">
                Do not close this window. The payment will be confirmed automatically.
              </p>

              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancel Payment
              </Button>
            </div>
          )}

          {/* SUCCESS step */}
          {step === "success" && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-success">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">{statusMsg}</p>
              </div>
              {mpesaReceipt && (
                <div className="bg-muted/50 border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">M-Pesa Receipt</p>
                  <p className="text-lg font-mono font-bold tracking-wider">{mpesaReceipt}</p>
                </div>
              )}
              <Progress value={100} className="h-2" />
              <Button onClick={onClose} className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold">
                Done
              </Button>
            </div>
          )}

          {/* FAILED step */}
          {step === "failed" && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-destructive">Payment Failed</p>
                <p className="text-sm text-muted-foreground">{statusMsg}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => { setStep("input"); setPollProgress(0); }} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleCancel} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
