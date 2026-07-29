import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PatientBillingSummary {
  patientId: string;
  patientName: string;
  cumulativeTotal: number;
  pendingBills: number;
  isRegistered: boolean;
}

export function usePOSPatientBilling(hospitalId?: string | null) {
  const [linkedPatient, setLinkedPatient] = useState<PatientBillingSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const linkPatient = useCallback(async (patientId: string) => {
    setLoading(true);
    try {
      // Fetch patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("id", patientId)
        .single();

      if (!patient) {
        setLinkedPatient(null);
        setLoading(false);
        return;
      }

      // Fetch cumulative pending bills
      let billQuery = supabase
        .from("bills")
        .select("total, amount_paid, status")
        .eq("patient_id", patientId)
        .in("status", ["pending", "partial"]);
      if (hospitalId) billQuery = billQuery.eq("hospital_id", hospitalId);
      const { data: bills } = await billQuery;

      const cumulativeTotal = (bills || []).reduce((sum: number, b: any) => {
        return sum + ((b.total || 0) - (b.amount_paid || 0));
      }, 0);

      setLinkedPatient({
        patientId: (patient as any).id,
        patientName: `${(patient as any).first_name} ${(patient as any).last_name}`,
        cumulativeTotal,
        pendingBills: (bills || []).length,
        isRegistered: true,
      });
    } catch {
      setLinkedPatient(null);
    }
    setLoading(false);
  }, [hospitalId]);

  const clearPatient = useCallback(() => {
    setLinkedPatient(null);
  }, []);

  const refreshBilling = useCallback(async () => {
    if (linkedPatient) {
      await linkPatient(linkedPatient.patientId);
    }
  }, [linkedPatient, linkPatient]);

  return { linkedPatient, loading, linkPatient, clearPatient, refreshBilling };
}
