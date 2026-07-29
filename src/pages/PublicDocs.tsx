import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Download, BookOpen, Shield, Code, Cog, ArrowLeft,
  Stethoscope, FlaskConical, Pill, CreditCard, Bed, Users, Activity,
  Heart, BarChart3, Building2, Clipboard, AlertTriangle, Smartphone,
  Globe, Lock, WifiOff, CheckCircle, ChevronDown, ChevronRight,
  Siren, Microscope, Calendar, UserCheck, Receipt, MonitorSmartphone,
} from "lucide-react";
import dashImg from "@/assets/dashboard-preview.jpg";
import pharmacyImg from "@/assets/pharmacy-pos.jpg";
import labImg from "@/assets/laboratory.jpg";
import teamImg from "@/assets/medical-team.jpg";
import heroImg from "@/assets/hero-hospital.jpg";

const documents = [
  {
    id: "operations-manual",
    title: "Operational Procedures Manual",
    version: "v3.1",
    type: "internal" as const,
    desc: "Comprehensive 200+ page manual covering all departmental workflows, SOPs, and operational procedures for every hospital department.",
    downloadUrl: "/docs/Brightcare_Operational_Procedures_Manual_v3.docx",
    icon: Clipboard,
    color: "bg-blue-600",
    pages: "200+",
    sections: ["Patient Management", "Clinical Operations", "Laboratory", "Pharmacy POS", "Billing & Finance", "Inpatient Care", "Emergency", "Surgery", "Radiology", "HR & Staff", "Quality Assurance", "M-Pesa Integration", "Offline Operations"],
  },
  {
    id: "system-docs",
    title: "System Documentation",
    version: "v3.0",
    type: "internal" as const,
    desc: "Complete technical and functional documentation covering 90+ modules, database schema, API reference, workflow integrations, and configuration guides.",
    downloadUrl: "/docs/Brightech_SmartCare_System_Documentation_v3.docx",
    icon: Code,
    color: "bg-purple-600",
    pages: "180+",
    sections: ["Executive Summary", "System Architecture", "Module Reference (90+)", "Database Schema", "API Reference", "Workflow Integration", "Payment Strategy", "Data Security", "Offline Desktop", "Troubleshooting", "Glossary"],
  },
  {
    id: "quick-start",
    title: "Quick Start Guide",
    version: "v2.0",
    type: "external" as const,
    desc: "Get up and running in 15 minutes. Step-by-step setup guide for hospital administrators including initial configuration, staff setup, and first patient registration.",
    icon: BookOpen,
    color: "bg-green-600",
    pages: "32",
    sections: ["Hospital Registration", "Admin Setup", "Staff Creation", "Department Config", "First Patient", "POS Configuration", "M-Pesa Setup", "Business Hours"],
  },
  {
    id: "user-guide",
    title: "Staff User Guide",
    version: "v2.0",
    type: "external" as const,
    desc: "Role-specific guides for doctors, nurses, pharmacists, lab technicians, billing staff, and administrators with illustrated workflows and keyboard shortcuts.",
    icon: Users,
    color: "bg-amber-600",
    pages: "120+",
    sections: ["Doctor Workflows", "Nurse Console Guide", "Pharmacist POS Guide", "Lab Technician Guide", "Billing & Cashier", "Admin Panel Guide", "Keyboard Shortcuts", "Mobile Usage Tips"],
  },
  {
    id: "api-reference",
    title: "Integration & API Reference",
    version: "v1.5",
    type: "internal" as const,
    desc: "Technical integration guide covering REST APIs, M-Pesa BrightPay gateway, webhook configurations, data export formats, and third-party system connections.",
    icon: Globe,
    color: "bg-cyan-600",
    pages: "85",
    sections: ["Authentication API", "Patient API", "Billing API", "M-Pesa Gateway", "Lab Integration", "Webhook Events", "Data Export", "FHIR Compatibility", "Security Headers"],
  },
];

const moduleGuides = [
  { icon: Users, title: "Patient Registration", desc: "Register patients, manage demographics, insurance, and emergency contacts with auto-generated patient IDs.", img: teamImg },
  { icon: Stethoscope, title: "Doctor Consultation", desc: "Complete consultation workflow with vitals, prescriptions, lab requests, diagnosis codes, and follow-up scheduling.", img: dashImg },
  { icon: FlaskConical, title: "Laboratory Management", desc: "Test requests, sample tracking, result entry with normal ranges, abnormality flags, and quality control metrics.", img: labImg },
  { icon: Pill, title: "Pharmacy POS", desc: "Barcode scanning, prescription queue, split payments, credit sales, returns, held receipts, and automatic inventory deduction.", img: pharmacyImg },
  { icon: CreditCard, title: "Billing & Payments", desc: "Consolidated billing from all departments, M-Pesa STK push, insurance claims, outstanding balances, and financial analytics.", img: heroImg },
  { icon: Bed, title: "Inpatient & Ward", desc: "Bed allocation with visual ward maps, nursing notes, vitals trending, diet plans, discharge workflows, and ward rounds.", img: teamImg },
];

const faqs = [
  { q: "Can Brightcare work without internet?", a: "Yes. Brightcare has a full offline-first architecture. All core operations — patient registration, pharmacy sales, consultations, billing — work completely offline. Data automatically syncs when connectivity returns." },
  { q: "How does M-Pesa payment integration work?", a: "Brightcare integrates with the BrightPay gateway to send STK push requests directly to patient phones. The system polls for payment confirmation and automatically generates receipts upon successful payment." },
  { q: "Is my hospital's data isolated from other hospitals?", a: "Absolutely. Each hospital operates as a separate tenant with strict data isolation. No hospital can see another's records. Platform features like departments and modules are shared, but all clinical and financial data is completely separated." },
  { q: "What happens when my license expires?", a: "The system provides warnings 7 days before expiry. If the license expires, the dashboard is temporarily locked but no data is lost. Simply renew to regain full access immediately." },
  { q: "Can I customize which modules are available?", a: "Yes. Hospital administrators can enable or disable any of the 90+ modules from the Module Management settings. Role-based permissions further control which staff members can access specific features." },
];

export default function PublicDocs() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-xs">B</div>
              <span className="text-lg font-bold">Brightcare</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-600">Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">Sign In</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Brightcare Documentation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">Everything you need to deploy, configure, and master the Brightcare Hospital Management System.</p>
        </div>
      </section>

      {/* Documents Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black">📚 Documentation Library</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Internal</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">External</Badge>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => (
              <Card key={doc.id} className="group hover:shadow-xl transition-all border-gray-100 overflow-hidden">
                <div className={`h-2 ${doc.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-11 w-11 rounded-xl ${doc.color} flex items-center justify-center`}>
                      <doc.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className={doc.type === "internal" ? "bg-blue-50 text-blue-700 border-blue-200 text-xs" : "bg-green-50 text-green-700 border-green-200 text-xs"}>
                      {doc.type === "internal" ? "Internal" : "External"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{doc.title}</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{doc.version}</span>
                    <span>•</span>
                    <span>{doc.pages} pages</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{doc.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {doc.sections.slice(0, 5).map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">{s}</Badge>
                    ))}
                    {doc.sections.length > 5 && <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">+{doc.sections.length - 5} more</Badge>}
                  </div>
                  {doc.downloadUrl ? (
                    <a href={doc.downloadUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors w-full justify-center">
                      <Download className="h-4 w-4" /> Download {doc.version}
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-semibold rounded-lg w-full justify-center cursor-default">
                      <FileText className="h-4 w-4" /> Available in-app
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Module Guides */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-black mb-2">🖥️ Module Highlights</h2>
          <p className="text-gray-600 mb-10">Visual overview of key system modules and their capabilities.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleGuides.map(m => (
              <div key={m.title} className="group rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 hover:shadow-xl transition-all">
                <div className="h-40 overflow-hidden relative">
                  <img src={m.img} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <m.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">{m.title}</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-black mb-8 text-center">❓ Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  {expandedFaq === i ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">© {new Date().getFullYear()} Brightcare by Brightech Publishers. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
