# BrightCare — Project Status & Roadmap

> **Project:** Brightcare Hospital Management System & Pharmacy POS
> **Lovable Project ID:** `04b91a5c-2f6e-47a3-b561-fa7ed6f56aaf`
> **Live URL:** https://bright-medicare.lovable.app
> **Last reviewed:** 2026-04-30

---

## 🎯 The Aim

Build the **definitive end-to-end hospital + pharmacy management platform for the Kenyan market**, delivered as a **hybrid product**:

1. **Online SaaS** (multi-tenant, browser-based) for clinics with reliable internet.
2. **Offline desktop app** (Electron, Windows portable) with cinematic installer experience and full sync-when-online capability for rural/intermittent-connection facilities.

The system must replace 4–6 separate tools that small Kenyan hospitals currently juggle (manual ledgers, M-Pesa SMS, paper prescriptions, Excel inventory, separate POS) with a single QuickBooks-grade dense, keyboard-first, professional clinical workspace.

**Brand promise:** speed, density, reliability, and *zero* ambiguity about who paid what, who owes what, and what's in stock — even when the internet drops.

---

## ✅ What We've Done So Far

### 1. Frontend & UX (Mature)
- **45 fully-wired pages** spanning Reception, OPD, Pharmacy, Lab, Inpatient, Billing, HR, Admin, Reports.
- **High-density QuickBooks aesthetic** — navy/teal, table-first, fixed viewport, keyboard navigation throughout.
- **Public landing page** at `/welcome` with full brand presentation.
- **AppLayout + AppSidebar** — single shell, responsive, role-aware module visibility.
- **Design system** in `src/index.css` + `tailwind.config.ts` (HSL semantic tokens only).
- **Shadcn UI components** customized for clinical density.
- **Cinematic 5-step provisioning wizard** for new hospital onboarding.

### 2. Backend & Data (Mature)
- **45 tables** across 32 timestamped migrations, fully typed in `types.ts`.
- **Single-schema multi-tenancy** via `hospital_id` + `safeSupabase` proxy — no cross-hospital leakage.
- **Live production data:** 8 hospitals, 28 staff, 209 patients, 1,584 medicines, 2,118 POS sales.
- **Bcrypt password hashing** via `hash_password()` / `verify_password()` SQL functions.
- **Edge functions** deployed: `staff-auth` (custom username/password login), `ai-assistant` (Gemini 3 Flash via Lovable AI Gateway).
- **RBAC matrix:** 7,785 role × feature_key permission rows, fully editable per-hospital.

### 3. Offline-First Architecture (Mature)
- `useOfflineQuery` hook — Supabase + IndexedDB fallback, filters by `hospital_id` locally.
- `connectivityGuard` — graceful degradation when offline.
- `syncEngine` — batched 50-record upserts when connection restored.
- Stable refs in query hooks to prevent re-render storms.

### 4. POS & Pharmacy (Mature)
- Full POS with quick-pick, held receipts, split payments, walk-in billing (WLK- prefix), credit sales.
- M-Pesa STK Push integration (KES only) with poll-verification and 254 phone normalization.
- FIFO dispensing, prescription queue from doctors → POS fulfillment.
- Excel-style 2D keyboard inventory editing with auto-commit.
- Cleaned-name medicine matching (handles brand/generic variants).
- Receipt designer with embedded-CSS HTML printing.

### 5. Clinical Workflow (Mature)
- Doctor consultation flow: `waiting → in_progress → completed` with vitals JSONB.
- Prescription items support both medicines AND lab service bundles in one Rx.
- ComboInput for fast searchable diagnosis/medication entry.
- Patient registration via Age input (auto-converted to DOB).
- Lab consumables auto-deduct on test completion (mandatory bundle selection).

### 6. Financials (Mature)
- Hybrid payment splits with exact tax lock-in.
- Daily staff settlement reconciliation (cash/M-Pesa/card/credit/gift/account).
- Refund management module with payment-destination corrections.
- Outstanding balances, credit sales tracker, financial analytics.

### 7. Licensing & SaaS (Mature)
- 4 packages (Trial, Basic, Standard, Premium) — KES tiers, M-Pesa maintenance payments.
- 14-day free trial with 7-day grace banner, then blur-lock.
- License key generation + activation flow.
- Platform admin (`wanjalabrighton63`) with global hospital provisioning.
- Read-only blurred overlays on unauthorized features (instead of hiding) — drives upgrades.

### 8. Operational Polish (Mature)
- Internal messaging (auto-expires 6h).
- Announcement system with priority + role targeting.
- Daily staff check-in.
- Audit trail.
- Soft-delete for medicines, hard-delete for bills (per business rules).
- Global search, workflow suggestions, AI assistant sidebar.

### 9. Documentation
- `mem://index.md` with 50+ memory rules covering architecture, RBAC, payments, UX standards.
- This file + `REMIX_MIGRATION_GUIDE.md`.

---

## 🚧 What Is Remaining

### A. Desktop Distribution (In Progress — Blocked)
- **Electron app builds successfully** locally (Windows x64 portable).
- **Cinematic installer screens** (8 screens: Welcome → License → Trial/Key → Package → Hospital Info → Install Progress → Completion → First Launch) — designed in project knowledge but **not yet implemented as actual installer UI**. Currently uses default Electron packager output.
- **Blocker:** desktop binaries (200+ MB) cannot be committed to GitHub. Pending decision to host build artifacts in Supabase `downloads` bucket and remove from source repo.
- **TODO:**
  - Implement the 8 cinematic installer screens with the documented animations (heartbeat progress bar, ECG line, narrated module installation, fireworks completion).
  - Set up a CI/release pipeline that builds the installer outside the repo and uploads to `downloads` bucket.
  - Add auto-update mechanism so installed desktops pull new versions.

### B. Database Hardening (Postponed — Intentional)
- All 45 tables currently have `Allow all` RLS policies (deferred per `mem://security/postponed-hardening`).
- Tenant isolation is enforced **only** at the application layer via `safeSupabase`.
- **TODO before scaling beyond pilot hospitals:**
  - Replace `Allow all` policies with `hospital_id = current_setting('app.current_hospital')::uuid` checks.
  - Migrate from custom `staff` table login to Supabase Auth + `user_roles` table per security best practices.
  - Add a `has_role(user_id, role)` SECURITY DEFINER function and rewrite policies against it.
  - Audit all edge functions for SERVICE_ROLE_KEY misuse.

### C. Sync Engine Edge Cases
- Current sync handles 50-record batches well, but **conflict resolution is last-write-wins**. Need:
  - Field-level merge for concurrent edits to the same patient/medicine.
  - Sync queue UI showing pending/failed records.
  - Manual conflict resolution screen for the rare collision.

### D. Reporting Depth
- Existing reports use HTML tables for export (per `mem://features/report-output-strategy`).
- **TODO:**
  - Native PDF generation for receipts/invoices/discharge summaries (currently HTML print).
  - Scheduled email reports (daily sales, weekly inventory low-stock).
  - Cross-hospital analytics for the Platform Admin dashboard.

### E. Integrations (Backlog)
- NHIF / SHA insurance claim submission (currently captured but not transmitted).
- KRA eTIMS receipt fiscalization (legally required for Kenyan businesses ≥5M turnover).
- WhatsApp Business API for appointment reminders (numbers already collected).
- SMS provider integration for OTP / patient notifications.

### F. AI Features (Foundation Laid, Expansion Pending)
- AI Assistant (Gemini 3 Flash) is wired but currently general-purpose chat.
- **TODO:**
  - Drug-interaction warnings on prescription create.
  - Auto-suggest ICD-10 diagnosis codes from chief complaint.
  - Smart inventory reorder suggestions based on sales velocity.
  - Patient summary generation for referral letters.

### G. Quality & Testing
- Vitest setup exists with one example test.
- **TODO:** meaningful coverage for billing math, prescription dispensing FIFO, M-Pesa flow, multi-tenant isolation.
- Playwright config exists; no e2e suites written yet.

### H. Mobile App
- Not started. Current responsive design assumes ≥1024px (clinical workstation use).
- Future: native mobile companion for doctors doing rounds (vitals entry, prescription create).

---

## 🎬 Immediate Next Steps (Priority Order)

1. **Resolve GitHub sync** — finish purging large desktop binaries from history (in progress, see `.lovable/plan.md`).
2. **Implement cinematic Electron installer screens** — biggest UX differentiator, partially designed.
3. **RLS hardening** before onboarding hospital #10.
4. **eTIMS fiscalization** — legal requirement, blocks larger client wins.
5. **PDF report generation** — most-requested feature from current pilot hospitals.

---

## 📐 Architecture One-Pager

```
┌──────────────────────────────────────────────────────────────┐
│  WEB (BrowserRouter)         DESKTOP (Electron, HashRouter)  │
│  https://bright-medicare     BrightcareSetup.exe             │
└──────────────┬─────────────────────────────┬─────────────────┘
               │                             │
               └─────────► safeSupabase ◄────┘
                          (hospital_id proxy)
                                │
               ┌────────────────┴───────────────┐
               │                                │
        useOfflineQuery                  Edge Functions
        (Supabase + IndexedDB)        (staff-auth, ai-assistant)
               │                                │
               └──────────► Lovable Cloud ◄─────┘
                            (Supabase, ref dcihnhwmkqxyfwefekpy)
                            45 tables · 32 migrations
                            8 hospitals · 209 patients · 2118 sales
```

---

## 📚 Reference Documents

- **`REMIX_MIGRATION_GUIDE.md`** — full instructions to remix without losing data.
- **`.lovable/plan.md`** — current GitHub-sync remediation plan.
- **`mem://index.md`** — 50+ memory rules (the project's "constitution").
- **`electron/README.md`** — desktop build instructions.
- **`supabase/migrations/`** — 32 timestamped schema migrations.

---

*This file is a living roadmap. Update it whenever a major milestone shifts between "remaining" and "done".*
