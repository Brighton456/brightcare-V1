import { useNavigate } from "react-router-dom";
import { 
  Calendar, Stethoscope, CreditCard, Bed, Pill, FileText, 
  UserPlus, FlaskConical, ClipboardList, ArrowRight, Heart,
  Receipt, Package, BarChart3, Activity, Users
} from "lucide-react";

interface Suggestion {
  label: string;
  icon: React.ElementType;
  path: string;
  color?: string;
}

const WORKFLOW_SUGGESTIONS: Record<string, Suggestion[]> = {
  "patient-registered": [
    { label: "Book Appointment", icon: Calendar, path: "/appointments" },
    { label: "Start Consultation", icon: Stethoscope, path: "/doctor-dashboard" },
    { label: "Admit Patient", icon: Bed, path: "/inpatient-ward" },
    { label: "View History", icon: FileText, path: "/patient-history" },
  ],
  "payment-completed": [
    { label: "Print Receipt", icon: Receipt, path: "/billing" },
    { label: "Book Follow-up", icon: Calendar, path: "/appointments" },
    { label: "Discharge Patient", icon: ClipboardList, path: "/discharge-workflow" },
    { label: "View Reports", icon: BarChart3, path: "/reports" },
  ],
  "consultation-done": [
    { label: "Write Prescription", icon: Pill, path: "/prescriptions" },
    { label: "Request Lab Test", icon: FlaskConical, path: "/lab-pending" },
    { label: "Process Payment", icon: CreditCard, path: "/process-payment" },
    { label: "Schedule Follow-up", icon: Calendar, path: "/follow-up-scheduling" },
    { label: "Admit Patient", icon: Bed, path: "/inpatient-ward" },
  ],
  "prescription-created": [
    { label: "Dispense at Pharmacy", icon: Package, path: "/pos" },
    { label: "Process Payment", icon: CreditCard, path: "/process-payment" },
    { label: "View Patient Records", icon: Heart, path: "/medical-records" },
  ],
  "lab-results-entered": [
    { label: "View in Doctor Console", icon: Stethoscope, path: "/doctor-dashboard" },
    { label: "Process Billing", icon: CreditCard, path: "/process-payment" },
    { label: "Update Patient Record", icon: FileText, path: "/medical-records" },
  ],
  "admission-created": [
    { label: "Record Vitals", icon: Activity, path: "/vitals-recording" },
    { label: "Add Nursing Notes", icon: ClipboardList, path: "/nursing-notes" },
    { label: "Assign Doctor", icon: Users, path: "/ward-rounds" },
    { label: "Bed Allocation", icon: Bed, path: "/bed-allocation" },
  ],
  "discharge-completed": [
    { label: "Final Bill", icon: CreditCard, path: "/process-payment" },
    { label: "Print Summary", icon: FileText, path: "/medical-records" },
    { label: "Schedule Follow-up", icon: Calendar, path: "/follow-up-scheduling" },
  ],
  "default": [
    { label: "Register Patient", icon: UserPlus, path: "/patients" },
    { label: "Book Appointment", icon: Calendar, path: "/appointments" },
    { label: "POS Sale", icon: Package, path: "/pos" },
    { label: "Reports", icon: BarChart3, path: "/reports" },
  ],
};

interface Props {
  context: string;
  title?: string;
  className?: string;
}

export function WorkflowSuggestions({ context, title, className = "" }: Props) {
  const navigate = useNavigate();
  const suggestions = WORKFLOW_SUGGESTIONS[context] || WORKFLOW_SUGGESTIONS["default"];

  return (
    <div className={`rounded-xl border bg-muted/20 p-3 ${className}`}>
      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <ArrowRight className="h-3 w-3" />
        {title || "What would you like to do next?"}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-all hover:shadow-sm">
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
