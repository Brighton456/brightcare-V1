import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import workflowDiagram1 from "@/assets/workflow-diagram-1.png";
import workflowDiagram2 from "@/assets/workflow-diagram-2.png";
import workflowDiagram3 from "@/assets/workflow-diagram-3.png";
import workflowDiagram4 from "@/assets/workflow-diagram-4.png";
import workflowDiagram5 from "@/assets/workflow-diagram-5.png";
import workflowDiagram6 from "@/assets/workflow-diagram-6.png";
import {
  FileText, ArrowRight, Heart, Stethoscope, FlaskConical,
  CreditCard, ShoppingCart, Bed, Shield, BarChart3, Activity,
  Pill, Users, Clipboard, Thermometer, Building2, UserCheck,
  Clock, CheckCircle, AlertTriangle, Receipt, Download, Code, BookOpen, Globe,
} from "lucide-react";

const shortWorkflows = [
  {
    title: "Prescription to Pharmacy Dispensing",
    steps: ["Doctor writes prescription", "Appears in Prescriptions page", "\"Send to Pharmacy\" clicked", "Pharmacy POS receives order", "Pharmacist dispenses medicine", "Stock auto-deducted from Inventory", "Billing auto-updated with pharmacy charges"],
    desc: "When a doctor completes a consultation and writes a prescription for a patient, the prescription is digitally created and immediately appears in the Prescriptions management page. From there, the attending physician or clinic staff clicks the \"Send to Pharmacy\" button, which updates the prescription status to 'sent_to_pharmacy' and makes it visible in the Pharmacy POS queue. The pharmacist then validates the prescription, searches for the prescribed drugs using barcode scanning or name search, checks stock availability and expiry dates, and dispenses the medicines. Upon dispensing, the system automatically deducts the dispensed quantities from the medicine inventory, records the pharmacy sale with full item details, and creates a corresponding billing entry linked to the patient's record. This ensures a seamless, error-free chain from clinical decision to medication delivery and financial recording.",
    icon: Pill,
    color: "text-emerald-600",
  },
  {
    title: "Lab Test Request to Results Delivery",
    steps: ["Doctor requests lab test", "Appears in Lab Pending queue", "Lab tech collects sample", "Test performed and results entered", "Results visible in Doctor Console", "Patient Records auto-updated", "Billing auto-linked with lab charges"],
    desc: "During a patient consultation, the doctor identifies the need for diagnostic testing and submits a lab test request directly from the Doctor Console. This request, including the test name, category, fee, and any special notes, is immediately inserted into the lab_tests table with a status of 'requested' and appears in the Laboratory Pending queue. A laboratory technician picks up the request, collects the patient's sample (updating the status to 'sample_collected'), performs the test, and enters the validated results along with normal ranges and abnormality flags. Upon submission, the system automatically updates the patient's medical record with the test results, notifies the requesting doctor by making the results visible in their consultation view, and creates or appends a billing line item for the lab fee to the patient's pending bill. If no pending bill exists, a new bill is automatically generated. This closed-loop workflow ensures no test request is lost, results are traceable, and all charges are captured.",
    icon: FlaskConical,
    color: "text-purple-600",
  },
  {
    title: "Nursing Notes to Inpatient Management",
    steps: ["Nurse adds shift notes", "Notes linked to admission record", "Visible in Inpatient Management", "Doctor Console auto-updated"],
    desc: "Nurses working on the ward use the Nursing Notes module to document patient observations, medication administration, handover notes, and clinical assessments. Each note is linked to the specific admission record via the admission_id, tagged with the current shift (morning, afternoon, or night), and categorized by note type (observation, medication, handover, or assessment). These notes are immediately visible in the Inpatient Management module, allowing charge nurses and ward managers to monitor patient care in real time. Additionally, the notes are accessible from the Doctor Console when the attending physician reviews the patient's admission details, ensuring seamless communication between nursing and medical staff without any manual data transfer.",
    icon: Clipboard,
    color: "text-blue-600",
  },
  {
    title: "Consultation Payment to Receipt",
    steps: ["Patient pays consultation fee", "Receipt auto-generated", "Billing module updates", "Payment linked to patient record"],
    desc: "When a consultation is completed, the system automatically generates a bill that includes the consultation fee, any applicable taxes, and potential discounts. The billing module presents this to the cashier or billing desk, where the patient can pay using cash, M-Pesa (via real Brightcare STK push integration), card, or insurance. Upon successful payment, a professional receipt is auto-generated with the hospital's branding, the payment details, and a unique receipt number. The billing record is updated to reflect the payment status (paid, partial, or pending), and the payment transaction is permanently linked to the patient's medical record for future reference and financial auditing.",
    icon: Receipt,
    color: "text-amber-600",
  },
  {
    title: "Pharmacy Sale to Inventory Update",
    steps: ["Pharmacy sale completed", "Stock auto-deducted per item", "Inventory levels updated", "Billing auto-linked", "Sales history updated"],
    desc: "Every pharmacy sale, whether initiated from a prescription or a walk-in purchase, triggers an automatic inventory update. When a sale is completed at the Pharmacy POS, each medicine item's quantity is deducted from the current stock levels in the medicines table. If any item falls below its configured reorder level, the system flags it for restocking on the Inventory and Expiry Alerts pages. The sale is recorded in the pharmacy_sales table with full details including the receipt number, payment method, items sold, and any discounts applied. The Sales History page is immediately updated to reflect the new transaction, and if the sale is linked to a patient, the billing module captures it as a pharmacy charge on the patient's account.",
    icon: ShoppingCart,
    color: "text-orange-600",
  },
  {
    title: "Lab Result Entry to Doctor Notification",
    steps: ["Lab result entered and validated", "Doctor notified via console", "Patient record permanently updated", "Lab charge auto-added to billing"],
    desc: "Once a laboratory technician enters and validates the test results — including the measured values, normal reference ranges, and abnormality indicators — the system performs three simultaneous actions: First, it updates the patient's permanent medical record with the complete test results, making them accessible from the Patient History and Medical Records modules. Second, the results become visible in the Doctor Console when the physician opens the patient's consultation record, effectively notifying them that diagnostic data is available for clinical decision-making. Third, the lab test fee is automatically appended to the patient's billing record, either by adding a line item to an existing pending bill or by creating a new bill if none exists. This triple-action workflow eliminates manual notification, prevents billing leakage, and ensures complete medical documentation.",
    icon: Activity,
    color: "text-cyan-600",
  },
];

const longWorkflows = [
  {
    title: "🏥 Patient Journey Workflow",
    icon: Heart,
    color: "border-l-blue-500",
    desc: "The complete patient journey begins when a patient arrives at the hospital's registration desk. The registration clerk enters the patient's demographic details — full name, date of birth, gender, contact information, identification number, and emergency contacts — into the system, which automatically generates a unique Patient ID (e.g., PAT-000123). If the patient has insurance coverage, the insurance provider and policy number are linked to their profile at this stage. The system then charges the initial consultation fee and updates the Doctor Console queue, placing the patient in the waiting list for their assigned physician.\n\nThe doctor reviews the patient's history, records vital signs, documents symptoms and chief complaints, and performs the clinical examination. Based on findings, the doctor may write an electronic prescription (which flows to the Pharmacy POS), request laboratory tests (which appear in the Lab Pending queue), or both. Lab technicians perform the requested tests, validate results, and submit them back to the system, where they appear in the Doctor Console for the physician to review and finalize the diagnosis.\n\nIf the patient needs medication, they proceed to the Pharmacy where the pharmacist validates and dispenses the prescribed drugs, with inventory automatically deducted. Throughout this journey, every service — consultation fees, lab test charges, pharmacy purchases, and any procedures — is captured by the Billing module, which consolidates all charges into a comprehensive bill. Upon discharge or visit completion, a final receipt is generated, and all records are permanently saved in the patient's electronic health record.",
  },
  {
    title: "👨‍⚕️ Doctor Consultation Workflow",
    icon: Stethoscope,
    color: "border-l-green-500",
    desc: "The doctor's workflow begins at login, where the system presents today's patient queue organized by appointment time and priority. The doctor opens a patient record to review their complete medical history, including past consultations, lab results, prescriptions, allergies, and chronic conditions. The doctor then creates a new consultation record, documenting the chief complaint, recording vital signs (blood pressure, pulse, temperature, weight, height, SpO2), and noting symptoms.\n\nDuring the examination, the doctor can request laboratory tests directly from the consultation view — specifying the test name, category (Blood, Urine, Imaging, etc.), and associated fee. The request is instantly queued in the Lab Pending module. The doctor can also write electronic prescriptions, selecting medicines from the pharmacy inventory, specifying dosage, frequency, duration, and quantity for each item. The prescription is auto-validated against the patient's allergy profile and drug interaction database.\n\nOnce the diagnosis is established, the doctor documents the diagnosis, treatment plan, and doctor notes. If a follow-up appointment is needed, the doctor schedules it directly from the consultation view. Upon completing the consultation, a digital signature is applied, a bill is auto-generated for the consultation fee, and all clinical data is permanently linked to the patient's electronic health record. The entire workflow — from queue review to signed consultation — is designed to minimize clicks and maximize clinical accuracy.",
  },
  {
    title: "🔬 Laboratory Testing Workflow",
    icon: FlaskConical,
    color: "border-l-purple-500",
    desc: "The laboratory workflow starts when a doctor's test request arrives in the Lab Pending queue, displaying the test name, patient details, requesting doctor, category, and priority level. A lab technician is assigned to the request and begins by collecting the patient's sample, at which point the system updates the test status to 'sample_collected' and records the collection timestamp.\n\nThe technician then performs the test according to standard protocols, using the lab's analytical instruments. During this phase, the status changes to 'in_progress'. Once the analysis is complete, the technician enters the results into the system, including measured values, normal reference ranges, and whether the results are abnormal. Supporting documents such as PDF reports or images can be attached to the test record.\n\nUpon submission, the system validates the results, updates the test status to 'completed', records the completion timestamp, and triggers three automated actions: the patient's medical record is updated with the new lab data, the requesting doctor is notified through their console, and the lab test fee is automatically added to the patient's billing record. The Lab Quality Control module tracks turnaround times, abnormality rates, and technician performance for continuous quality improvement.",
  },
  {
    title: "💊 Pharmacy Sales Workflow",
    icon: Pill,
    color: "border-l-orange-500",
    desc: "The pharmacy workflow handles both prescription-based and walk-in sales. For prescription-based sales, the workflow begins when a doctor's prescription arrives at the pharmacy (status: 'sent_to_pharmacy'). The pharmacist opens the prescription, validates each item against the patient's profile (checking for allergies, drug interactions, and contraindications), and searches for the prescribed drugs in the POS system using barcode scanning or name search.\n\nThe system checks real-time stock availability and displays expiry alerts if any selected batch is approaching its expiry date. The pharmacist selects the appropriate medicines, confirms quantities, and the POS calculates the total including any applicable discounts or tax. Upon completing the sale, the system records the transaction in pharmacy_sales with full details, deducts the sold quantities from medicine inventory, updates the sales history, and links the pharmacy charges to the patient's billing record.\n\nFor walk-in customers, the pharmacist directly searches and adds items to the POS cart, applies any discounts, processes payment (Cash, M-Pesa, Card, or Credit), and prints or saves the receipt. The inventory is updated in real time, and the sales data feeds into the Reports and Analytics modules for business intelligence. The POS also supports held sales (F3), split payments (F6), returns (F5), and credit sales (F7) for comprehensive pharmacy operations.",
  },
  {
    title: "💳 Billing & Payment Workflow",
    icon: CreditCard,
    color: "border-l-red-500",
    desc: "The billing workflow operates as a central financial hub that aggregates charges from all hospital departments. When a consultation is completed, the consultation fee is automatically added as a bill line item. When lab tests are completed, their fees are appended to the patient's pending bill. When pharmacy sales are linked to a patient, the medicine costs are captured in the billing record. For inpatient admissions, bed charges, nursing services, surgical procedures, and other ward-related costs are continuously accumulated.\n\nThe billing module consolidates all these charges into a comprehensive invoice showing itemized charges by category (consultation, lab, pharmacy, procedure, inpatient). The system calculates the subtotal, applies any discounts, computes applicable taxes, and presents the final total. Payment can be processed through multiple methods: Cash (with change calculation), M-Pesa (via real Brightcare STK push that sends a payment prompt to the customer's phone and polls for confirmation), Card payment, Insurance claims (with provider and policy details), or Credit terms.\n\nUpon successful payment, the system generates a professional receipt with the hospital's branding, updates the payment status, records the transaction in the payment history, and links everything to the patient's permanent record. Outstanding balances are tracked on the Outstanding Balances page, and the financial data feeds into the Billing Analytics and Reports modules for revenue analysis, department-wise income tracking, and financial forecasting.",
  },
  {
    title: "🏨 Inpatient Care Workflow",
    icon: Bed,
    color: "border-l-violet-500",
    desc: "The inpatient workflow begins when a doctor determines that a patient requires admission. An admission record is created with the admission number, diagnosis, reason for admission, and admission type (general, emergency, surgical, maternity). The Bed Allocation module displays a visual ward map showing available and occupied beds across all wards, and the admitting staff assigns an appropriate bed based on the patient's needs and ward type (General, ICU, Maternity, Pediatric, Private, Surgical).\n\nOnce admitted, the Nurse Console becomes the primary interface for patient care. Nurses record vital signs at regular intervals — blood pressure, pulse rate, temperature, respiratory rate, SpO2, blood sugar, weight, and pain level — which are stored in the vitals_records table and displayed as trend charts for monitoring. Nursing notes document observations, medication administration, handovers between shifts, and clinical assessments, all linked to the admission record.\n\nWard rounds are scheduled and tracked, with doctors reviewing each admitted patient's progress. Diet plans are assigned based on the patient's diagnosis (diabetic diet, cardiac diet, renal diet, etc.), and the Nutrition & Dietetics module manages meal planning. If surgery is needed, the Surgery Scheduling module coordinates theatre bookings, surgical team assignments, and pre/post-operative care plans. For critically ill patients, the ICU Monitoring module provides intensive real-time vitals tracking.\n\nWhen the patient is ready for discharge, the Discharge Workflow is triggered. The attending doctor writes a discharge summary, the billing module consolidates all inpatient charges (bed charges, nursing services, procedures, medications, meals), a final bill is generated, and payment is processed. The bed is released back to the available pool, and the patient's complete admission record — including all vitals, notes, procedures, and billing — is permanently archived in their medical history.",
  },
  {
    title: "📊 Administration Workflow",
    icon: Shield,
    color: "border-l-slate-500",
    desc: "The administration workflow encompasses all operational management functions of the hospital. System administrators log in to configure user roles and permissions, defining who can access which modules and what actions they can perform (view, create, edit, delete). Consultation fees and service charges are configured hospital-wide through the Settings module, ensuring consistent pricing across all departments.\n\nStaff management includes onboarding new employees, assigning departments, recording qualifications and license numbers, and managing duty rosters. The Attendance Tracking module monitors staff check-ins and check-outs, while the HR & Payroll module handles salary calculations, deductions, and payment processing. Performance reviews track KPIs for individual staff members.\n\nThe Activity Log provides a comprehensive audit trail, recording every significant action taken in the system — who did what, when, and from which module. This supports accountability, compliance, and incident investigation. Financial oversight is provided through the Billing Analytics dashboard, which shows revenue trends, department-wise income, payment method distribution, and outstanding balances.\n\nReports can be generated across all modules — patient volume, revenue analysis, inventory valuation, lab turnaround times, and more — with export capabilities to CSV format. Compliance Tracking monitors regulatory requirements, while Incident Reporting captures and manages any operational incidents. System backups are scheduled to protect all hospital data, and the Asset Management module tracks physical hospital assets from procurement to disposal.",
  },
  {
    title: "🌐 Patient Experience Workflow",
    icon: Users,
    color: "border-l-teal-500",
    desc: "The patient experience workflow is designed to make the hospital visit as smooth and transparent as possible. Upon arrival, patients can use a self-check-in kiosk to register themselves, receive a QR wristband, and join the virtual queue. The system sends SMS alerts to keep patients informed about their position in the queue and estimated wait times.\n\nAs the patient moves across departments — from registration to consultation, laboratory, pharmacy, and billing — their journey is tracked and updated in real time. Each department scans the patient's QR wristband to pull up their records instantly, eliminating paper-based handoffs and reducing errors. The family portal allows authorized family members to view the patient's current status, admission details, and upcoming procedures.\n\nThe Telemedicine Hub enables remote consultations for follow-up appointments or specialist referrals, allowing patients to connect with doctors via video call without visiting the hospital. The Patient Feedback module collects satisfaction ratings and comments, which feed into the Quality Assurance dashboard for continuous improvement.\n\nUpon visit completion or discharge, the patient receives their final bill, makes payment through their preferred method, and receives a digital receipt. All medical records, prescriptions, lab results, and billing history are permanently stored and can be accessed for future visits, insurance claims, or referrals to other healthcare providers.",
  },
];

const modules = [
  { name: "Hospital Management", features: ["Patient Registration", "Records", "Appointments", "Staff Management", "Departments", "Emergency Tracking", "Insurance Info", "Visitor Management", "Audit Logs"], color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { name: "Doctor & Consultation", features: ["Doctor Console", "Patient Queue", "Prescriptions", "Lab Requests", "Clinical Notes", "Treatment Plans", "Follow-up Scheduling", "Drug Interaction Alerts"], color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { name: "Laboratory", features: ["Pending Tests", "Result Entry", "Test History", "Urgent Flagging", "Result Notifications", "Sample Tracking", "Quality Control"], color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { name: "Billing & Payments", features: ["Bill Creation", "M-Pesa STK Push", "Insurance Claims", "Split Billing", "Refund Management", "Payment History", "Auto Receipts"], color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { name: "Pharmacy POS", features: ["Drug Search", "Barcode Scanning", "Prescription Linking", "Stock Deduction", "Expiry Warnings", "Sales History", "Returns/Refunds"], color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { name: "Inpatient & Ward", features: ["Bed Allocation", "Nurse Console", "Vitals Recording", "Nursing Notes", "Patient Monitoring", "Diet Plans", "Discharge Workflow"], color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  { name: "Administration", features: ["HR & Payroll", "Reports & Analytics", "KPI Dashboards", "Compliance Tracking", "Asset Management", "Custom Report Builder"], color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400" },
];

const workflowImages = [
  { src: workflowDiagram1, alt: "Hospital Department Integration — Patient Journey, Doctor Workflow, Laboratory Workflow, Pharmacy Workflow, Billing Workflow, Administration Workflow, and Inpatient Workflow showing interconnected data flow across registration, consultation, testing, dispensing, billing, and ward management departments", caption: "Department Integration Overview — This diagram illustrates how each hospital department connects to form a unified system. Patient data flows from Registration to the Doctor Console, where prescriptions route to Pharmacy and lab requests feed into the Laboratory queue. All service charges — consultations, lab tests, pharmacy sales, and inpatient services — converge in the Billing module for consolidated invoicing and payment processing." },
  { src: workflowDiagram2, alt: "Comprehensive Patient Journey showing the complete care pathway from Patient Arrives through Patient ID Generated, Doctor Consultation, Lab Test Requested, Lab Generated, to Patient Discharge, followed by Doctor Consultation Workflow, Integrated Billing Workflow, Laboratory Testing Process, and Inpatient Care Workflow", caption: "Comprehensive System Workflows — The complete patient lifecycle is visualized across five interconnected workflow streams: the Patient Journey from arrival to discharge, the Doctor Consultation sequence from login to follow-up scheduling, the Integrated Billing chain from service charges through payment processing to receipt generation, the Laboratory Testing pipeline from order to validated results, and the Inpatient Care pathway from admission through bed assignment, vitals monitoring, surgery scheduling, and ICU care to final billing." },
  { src: workflowDiagram3, alt: "Patient Journey Workflow and Doctor Consultation Workflow showing Registration to Lab Test Requested flow, Doctor Login to Schedule Follow-Up flow, Laboratory Testing Workflow with sample collection and result verification, Inpatient Care Workflow, and Billing and Pharmacy consolidated payment workflow", caption: "Workflow Integration Map — This reference diagram shows the six core workflows operating in parallel. The Patient Journey tracks the clinical pathway; the Doctor Consultation flow handles the diagnostic decision-making process; the Laboratory workflow manages sample-to-result operations; the Inpatient pathway covers admission through discharge; the Billing workflow consolidates all financial transactions; and the Administration workflow underpins everything with user role configuration, staff scheduling, financial oversight, report generation, and compliance tracking." },
  { src: workflowDiagram4, alt: "Advanced Hospital Workflow showing Comprehensive Patient Journey with Patient ID Created through Consultation to Lab Test to Medication, Integrated Doctor Workflow from Login through Queue to Diagnose to Prescription to Lab Test to Pharmacy, Advanced Billing and Payment Process from Service Charges through Invoice to Payment to Records, Efficient Laboratory Workflow from Request through Sample to Testing to Validation, and Inpatient Care and Monitoring from Admission through Bed Assignment to Surgery to Discharge", caption: "Advanced Workflow Architecture — This comprehensive visualization demonstrates the depth of integration across all hospital operations. The Patient Journey flows seamlessly from ID creation through consultation, lab testing, and medication dispensing. The Doctor Workflow shows the complete clinical decision path. The Billing process tracks every charge from service delivery to final payment recording. The Laboratory workflow ensures quality control at every stage. The Inpatient module manages the full admission lifecycle including surgery coordination and ICU monitoring." },
  { src: workflowDiagram5, alt: "Hospital Workflow Summary showing Patient Journey from Arrival through Registration to Doctor Consultation, Doctor Workflow from Login to Queue to Diagnosis to Prescription, Laboratory from Request to Sample to Test to Results to Doctor Notification, Pharmacy from Prescription to Dispensing to Inventory Update, Billing and Inpatient Workflow integration, and Patient Experience with staff check-in and feedback portal", caption: "Workflow Summary & Patient Experience — This diagram provides a high-level overview of all departmental workflows while highlighting the Patient Experience layer that operates alongside clinical operations. The summary shows how staff check-in, optimized workflows, virtual queues, lab and pharmacy visits, feedback portals, and final billing create a holistic patient experience from arrival to departure." },
  { src: workflowDiagram6, alt: "Patient Journey Flow showing Complete Care Pathway from Patient Arrives through Registration and Patient ID to Consultation with Doctor to Lab Test Ordered to Lab Results to Pharmacy Purchase to Final Billing, Doctor Consultation Flow showing Integrated Doctor Dashboard with Login to View Patient Queue to Examine and Diagnose to Request Lab Test to Send Rx to Pharmacy to Schedule Follow-Up, Laboratory Process Flow showing Accurate Lab Testing from Lab Request Received to Collect Sample to Validate Results to Post Results to Doctor, Pharmacy Sales Flow showing Efficient Medication Dispensing from Prescription Verified to Select Medication to Dispense Medicine to Update Inventory to Process Payment, and Billing and Payment Flow showing Complete Financial Workflow from Consolidate Charges to Generate Invoice to Accept Payment to Post Records", caption: "Integrated Flow Architecture — This master diagram demonstrates the complete data flow architecture of Brightcare. The Patient Journey shows the end-to-end care pathway including lab testing and pharmacy purchases. The Doctor Dashboard integrates examination, diagnosis, prescription, and lab request capabilities. The Laboratory ensures accurate testing with sample collection, analysis, and result validation. The Pharmacy manages efficient medication dispensing with inventory tracking. The Billing module provides a complete financial workflow from charge consolidation through invoice generation to payment acceptance and record posting." },
];

export default function SystemDocumentation() {
  return (
    <AppLayout title="System Documentation">
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h1 className="text-2xl font-bold">Brightcare — System Architecture & Workflow Documentation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive Hospital Management & Medical POS — Module Reference, Integration Flows & Department Workflows
          </p>
          <p className="text-xs text-muted-foreground mt-2">Prepared by Product Development Initiative — Brightcare by Brightech</p>
        </div>

        <Tabs defaultValue="documents">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="documents">📄 Documents</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Diagrams</TabsTrigger>
            <TabsTrigger value="short">Short Workflows</TabsTrigger>
            <TabsTrigger value="long">Full Department Journeys</TabsTrigger>
            <TabsTrigger value="modules">Module Reference</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border">
              <p className="font-semibold text-foreground mb-1">📚 Downloadable Documentation</p>
              <p>Access comprehensive manuals, guides, and reference documents for the Brightcare platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Operational Procedures Manual", version: "v3.1", icon: Clipboard, color: "bg-blue-600", pages: "200+", desc: "Comprehensive manual covering all departmental workflows, SOPs, and operational procedures.", url: "/docs/Brightcare_Operational_Procedures_Manual_v3.docx" },
                { title: "System Documentation", version: "v3.0", icon: Code, color: "bg-purple-600", pages: "180+", desc: "Complete technical and functional documentation covering 90+ modules, database schema, and API reference.", url: "/docs/Brightech_SmartCare_System_Documentation_v3.docx" },
                { title: "Quick Start Guide", version: "v2.0", icon: BookOpen, color: "bg-green-600", pages: "32", desc: "Get up and running in 15 minutes with step-by-step setup for hospital administrators." },
                { title: "Staff User Guide", version: "v2.0", icon: Users, color: "bg-amber-600", pages: "120+", desc: "Role-specific guides for doctors, nurses, pharmacists, lab technicians, and billing staff." },
                { title: "Integration & API Reference", version: "v1.5", icon: Globe, color: "bg-cyan-600", pages: "85", desc: "Technical integration guide covering REST APIs, M-Pesa gateway, and webhook configurations." },
              ].map(doc => (
                <Card key={doc.title} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl ${doc.color} flex items-center justify-center shrink-0`}>
                        <doc.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{doc.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.version} · {doc.pages} pages</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{doc.desc}</p>
                    {doc.url ? (
                      <a href={doc.url} download className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-colors w-full justify-center">
                        <Download className="h-4 w-4" /> Download {doc.version}
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground text-sm font-semibold rounded-lg w-full justify-center">
                        <FileText className="h-4 w-4" /> Available in-app
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Workflow Diagrams Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border">
              <p className="font-semibold text-foreground mb-1">📊 Visual Workflow Reference</p>
              <p>The following diagrams illustrate how each department in Brightcare connects to form a unified, end-to-end hospital management system. Each diagram shows the data flow between modules — from patient registration through clinical consultation, laboratory testing, pharmacy dispensing, billing, and inpatient care — demonstrating how every action in one department automatically triggers the appropriate response in connected departments.</p>
            </div>
            {workflowImages.map((img, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Workflow Diagram {i + 1} of {workflowImages.length}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <img src={img.src} alt={img.alt} className="w-full rounded-lg border" loading="lazy" />
                  <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary">
                    <p className="text-sm text-muted-foreground leading-relaxed">{img.caption}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Short Workflows Tab */}
          <TabsContent value="short" className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border">
              <p className="font-semibold text-foreground mb-1">⚡ Quick Action Chains</p>
              <p>Short workflows represent quick, automated chains of actions that connect two or more departments in response to a single trigger. These chains ensure that every clinical or operational action produces the correct downstream effects — stock updates, billing entries, record updates, and notifications — without any manual intervention.</p>
            </div>
            {shortWorkflows.map((wf, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <wf.icon className={`h-5 w-5 ${wf.color}`} />
                    {wf.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {wf.steps.map((step, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">{step}</Badge>
                        {j < wf.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{wf.desc}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Long Workflows Tab */}
          <TabsContent value="long" className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border">
              <p className="font-semibold text-foreground mb-1">🔄 Full Department Journeys</p>
              <p>Long workflows describe the complete end-to-end journey through each major department, showing every step, decision point, and automated action that occurs from the initial trigger to the final outcome. These journeys demonstrate how the system handles complex, multi-step processes that span multiple modules and involve multiple staff roles.</p>
            </div>
            {longWorkflows.map((wf, i) => (
              <Card key={i} className={`border-l-4 ${wf.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <wf.icon className="h-5 w-5" />
                    {wf.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{wf.desc}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Module Reference Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border">
              <p className="font-semibold text-foreground mb-1">📋 Module Feature Reference</p>
              <p>Each module in Brightcare is a self-contained functional unit with its own pages, forms, and data management capabilities. While modules operate independently, they are fully interconnected through shared database tables, automated triggers, and cross-module workflows to provide a seamless hospital management experience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {modules.map(mod => (
                <Card key={mod.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{mod.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {mod.features.map(f => (
                        <Badge key={f} className={`text-[10px] ${mod.color}`}>{f}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Version info */}
        <div className="text-center text-xs text-muted-foreground py-4 border-t">
          <p>Brightcare v2.0 · Comprehensive Hospital Management & Medical POS</p>
          <p className="mt-1">Prepared by Product Development Initiative — Brightcare by Brightech</p>
        </div>
      </div>
    </AppLayout>
  );
}
