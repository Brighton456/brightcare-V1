import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-hospital.jpg";
import teamImg from "@/assets/medical-team.jpg";
import dashImg from "@/assets/dashboard-preview.jpg";
import pharmacyImg from "@/assets/pharmacy-pos.jpg";
import labImg from "@/assets/laboratory.jpg";
import {
  Heart, Stethoscope, FlaskConical, Pill, CreditCard, Bed, Shield, BarChart3,
  Activity, Users, Clock, CheckCircle, Smartphone, Wifi, WifiOff, ArrowRight,
  FileText, Building2, Globe, Zap, Star, ChevronRight, MonitorSmartphone,
  Lock, CloudCog, HeartPulse, Siren, Microscope, Calendar, UserCheck,
  Phone, Mail, MessageCircle, Download, Monitor, Apple, Laptop,
} from "lucide-react";
import brightcareLogo from "@/assets/brightcare-logo.png";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const features = [
  { icon: Users, title: "Patient Management", desc: "Complete patient lifecycle from registration to discharge with electronic health records." },
  { icon: Stethoscope, title: "Doctor Console", desc: "Smart consultation workflow with prescriptions, lab requests, and clinical notes." },
  { icon: FlaskConical, title: "Laboratory", desc: "Full lab workflow — test requests, sample tracking, results entry, and quality control." },
  { icon: Pill, title: "Pharmacy POS", desc: "Advanced point-of-sale with barcode scanning, prescription queue, and inventory management." },
  { icon: CreditCard, title: "Billing & Payments", desc: "Integrated billing with M-Pesa STK push, insurance claims, and financial analytics." },
  { icon: Bed, title: "Inpatient & Ward", desc: "Bed allocation, nursing notes, vitals recording, diet plans, and discharge workflows." },
  { icon: Siren, title: "Emergency Department", desc: "Triage management, emergency protocols, and rapid response coordination." },
  { icon: Microscope, title: "Radiology & Imaging", desc: "Digital imaging workflows with DICOM-ready result management." },
  { icon: HeartPulse, title: "ICU Monitoring", desc: "Real-time intensive care vitals tracking with alarm thresholds and trend analysis." },
  { icon: Calendar, title: "Appointments", desc: "Smart scheduling with doctor availability, wait time monitoring, and patient reminders." },
  { icon: Shield, title: "Quality Assurance", desc: "Compliance tracking, incident reporting, infection control, and audit trails." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Comprehensive dashboards for revenue, clinical outcomes, and operational insights." },
];

const stats = [
  { value: "90+", label: "Specialized Modules" },
  { value: "300+", label: "Configurable Permissions" },
  { value: "24/7", label: "Offline Capability" },
  { value: "100%", label: "Data Security" },
];

const testimonials = [
  { name: "Dr. Sarah Kimani", role: "Medical Director, Nairobi General", quote: "Brightcare transformed how we manage patient flow. Our wait times dropped by 40% in the first month." },
  { name: "James Odhiambo", role: "Hospital Administrator, Kisumu Health Center", quote: "The billing integration alone saved us from KES 200,000 monthly revenue leakage. It's a game-changer." },
  { name: "Nurse Florence Mwangi", role: "Head Nurse, Mombasa Regional", quote: "Nursing notes and vitals tracking are seamless. Handovers between shifts have never been this smooth." },
];

export default function LandingPage() {
  const { settings: ps } = usePlatformSettings();
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <img src={brightcareLogo} alt="Brightcare" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-xl font-bold tracking-tight">Brightcare</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Modules</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
            <Link to="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white" />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
                <Zap className="h-3.5 w-3.5" /> East Africa's Leading HMS Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight mb-6">
                The Future of <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Hospital Management</span> is Here
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                One unified platform for patient care, billing, pharmacy, laboratory, inpatient management, and 90+ specialized modules — with full offline capability and M-Pesa integration.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all text-base">
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/docs" className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-base">
                  <FileText className="h-5 w-5" /> View Documentation
                </Link>
              </div>
              {/* Desktop Download Row */}
              <div className="flex flex-wrap items-center gap-3 mb-10">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desktop App:</span>
                <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-win32-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Monitor className="h-3.5 w-3.5" /> Windows
                </a>
                <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-darwin-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Apple className="h-3.5 w-3.5" /> macOS
                </a>
                <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-linux-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <Laptop className="h-3.5 w-3.5" /> Linux
                </a>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> M-Pesa ready</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-gray-200">
                <img src={heroImg} alt="Modern hospital facility" width={1920} height={1080} className="w-full h-auto object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"><Activity className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">Active Hospitals</p><p className="text-lg font-black">150+</p></div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-xs text-gray-500">Staff Users</p><p className="text-lg font-black">5,000+</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-4xl md:text-5xl font-black text-white mb-2">{s.value}</p>
                <p className="text-blue-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section with Images */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Built for <span className="text-blue-600">Every Department</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From the front desk to the operating theatre, Brightcare connects every workflow into one seamless experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { img: teamImg, title: "Collaborative Care", desc: "Doctors, nurses, and lab technicians work together seamlessly through real-time notifications and shared patient records." },
              { img: pharmacyImg, title: "Smart Pharmacy POS", desc: "Barcode scanning, prescription queues, split payments, credit sales, and automatic inventory deduction — all in one interface." },
              { img: labImg, title: "Digital Laboratory", desc: "From test request to validated results, every step is tracked with full quality control and turnaround analytics." },
            ].map(item => (
              <div key={item.title} className="group rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="h-52 overflow-hidden">
                  <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">Powerful Dashboard at a Glance</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Get real-time insights into patient flow, revenue, appointment schedules, and critical alerts — all from one beautifully designed command center.
              </p>
              <ul className="space-y-3">
                {["Real-time patient queue & wait times", "Revenue & billing analytics", "Department-wise performance metrics", "Critical alerts & expiry notifications", "Staff attendance & workload tracking"].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <img src={dashImg} alt="Brightcare Dashboard" loading="lazy" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">90+ Integrated <span className="text-blue-600">Modules</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Every department, every workflow, one unified platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map(f => (
              <div key={f.title} className="group p-5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Why Choose <span className="text-blue-600">Brightcare</span>?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: WifiOff, title: "Offline-First Architecture", desc: "Full functionality even without internet. Auto-syncs when connectivity returns — zero downtime for your hospital." },
              { icon: Smartphone, title: "M-Pesa Integration", desc: "Native STK push payments via BrightPay gateway. Patients pay from their phone, receipts auto-generate instantly." },
              { icon: Lock, title: "Enterprise Security", desc: "Role-based access with 300+ permissions, complete audit trail, data encryption, and multi-tenant isolation." },
              { icon: CloudCog, title: "Cloud + Desktop", desc: "Access from any browser or download the offline desktop app for Windows, macOS, or Linux. Your data stays synced across all devices.", hasDownload: true },
              { icon: Globe, title: "Multi-Hospital SaaS", desc: "Manage multiple hospitals from one platform. Each facility gets isolated data with shared platform features." },
              { icon: MonitorSmartphone, title: "Responsive Design", desc: "Works beautifully on desktop, tablet, and mobile. Designed for the fast-paced hospital environment." },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                {'hasDownload' in item && item.hasDownload && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-win32-x64.zip" download className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Monitor className="h-3 w-3" /> Windows
                    </a>
                    <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-darwin-x64.zip" download className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Apple className="h-3 w-3" /> macOS
                    </a>
                    <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-linux-x64.zip" download className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Laptop className="h-3 w-3" /> Linux
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Trusted by <span className="text-blue-600">Healthcare Leaders</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Transform Your Hospital?</h2>
          <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">Start your 14-day free trial today. No credit card required. Full access to all modules.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-base">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/docs" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-base">
              <FileText className="h-5 w-5" /> Read Documentation
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-blue-300 text-xs font-semibold self-center mr-1">Download Desktop:</span>
            <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-win32-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Monitor className="h-3.5 w-3.5" /> Windows
            </a>
            <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-darwin-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Apple className="h-3.5 w-3.5" /> macOS
            </a>
            <a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-linux-x64.zip" download className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Laptop className="h-3.5 w-3.5" /> Linux
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={brightcareLogo} alt="Brightcare" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-white font-bold">Brightcare</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">Enterprise-grade Hospital Management & Medical POS System by Brightech Publishers.</p>
              <div className="space-y-2">
                <a href={`mailto:${ps.support_email}`} className="flex items-center gap-2 text-sm hover:text-white transition-colors"><Mail className="h-3.5 w-3.5" /> {ps.support_email}</a>
                <a href={`tel:${ps.support_phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm hover:text-white transition-colors"><Phone className="h-3.5 w-3.5" /> {ps.support_phone}</a>
                <a href={`tel:${ps.support_phone_2.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm hover:text-white transition-colors"><Phone className="h-3.5 w-3.5" /> {ps.support_phone_2}</a>
                <a href={`https://wa.me/${ps.whatsapp_number.replace(/[\s+]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Modules</a></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/docs" className="hover:text-white transition-colors">System Docs</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Operations Manual</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Get Started</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Free Trial</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
              <h4 className="text-white font-semibold mb-3 mt-6 text-sm flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Desktop App</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-win32-x64.zip" download className="flex items-center gap-1.5 hover:text-white transition-colors"><Monitor className="h-3 w-3" /> Windows (x64)</a></li>
                <li><a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-darwin-x64.zip" download className="flex items-center gap-1.5 hover:text-white transition-colors"><Apple className="h-3 w-3" /> macOS (x64)</a></li>
                <li><a href="https://dcihnhwmkqxyfwefekpy.supabase.co/storage/v1/object/public/downloads/BrightechSmartCare-linux-x64.zip" download className="flex items-center gap-1.5 hover:text-white transition-colors"><Laptop className="h-3 w-3" /> Linux (x64)</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs">
            <p>© {new Date().getFullYear()} Brightcare by Brightech Publishers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
