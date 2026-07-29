# BrightCare — Remix Migration Guide (Preserve All Data)

> **Goal:** Remix this project into a fresh Lovable project **without losing any database data, users, or backend wiring.**
> **Status of source backend:** Lovable Cloud (Supabase) project ref `dcihnhwmkqxyfwefekpy`, fully populated production data.

---

## ⚠️ Read this first

When you remix a Lovable project, the new project gets a **brand-new empty Lovable Cloud backend** (new Supabase project ref, new URL, new anon key, empty tables). The frontend code is copied, but:

- ❌ Database rows do **NOT** copy
- ❌ Auth users / staff records do **NOT** copy
- ❌ Storage bucket files do **NOT** copy
- ❌ Edge function secrets do **NOT** copy
- ✅ Source code, migrations, and edge function code **DO** copy

To keep everything intact, you must **either**:

**Option A (recommended):** Keep using the same backend in the remix — point the remixed frontend at THIS project's Supabase URL/keys. Zero data migration needed.

**Option B:** Let the remix create a new backend, then export-and-import every table + re-upload storage + recreate secrets.

---

## ✅ OPTION A — Reuse the Existing Backend (Zero Data Loss, 5 minutes)

This is the safest path. The remixed app becomes a second frontend pointed at the same live database.

### Step 1 — After remixing, locate these auto-generated files in the NEW project:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `supabase/config.toml`

These will be regenerated to point at the new empty backend. **Do not edit them directly** — Lovable overwrites them.

### Step 2 — Disable Lovable Cloud on the remix
In the remixed project: **Connectors → Lovable Cloud → Disable Cloud**.
This stops Lovable from auto-managing those four files.

### Step 3 — Manually wire to THIS project's backend
Replace the four files with these exact values (current production values):

**`.env`**
```
VITE_SUPABASE_URL=https://dcihnhwmkqxyfwefekpy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaWhuaHdta3F4eWZ3ZWZla3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTMyNzQsImV4cCI6MjA5MDM2OTI3NH0.I0vxuT_o3X3axHQQtVcCSRDovPOKXn1x_DzM09o68sE
VITE_SUPABASE_PROJECT_ID=dcihnhwmkqxyfwefekpy
```

**`supabase/config.toml`**
```
project_id = "dcihnhwmkqxyfwefekpy"
```

**`src/integrations/supabase/client.ts`** — copy verbatim from this project (the remix should have an identical template; just ensure the URL/key constants match the values above).

**`src/integrations/supabase/types.ts`** — copy verbatim from THIS project. It mirrors the live DB schema and must not be regenerated against an empty backend.

### Step 4 — Re-add edge function secrets (if you redeploy edge functions)
The remixed project's edge function runtime needs the same secrets. Add via Lovable Cloud → Secrets:
- `LOVABLE_API_KEY` (auto-managed)
- `SUPABASE_URL` = `https://dcihnhwmkqxyfwefekpy.supabase.co`
- `SUPABASE_ANON_KEY` = (same as publishable key above)
- `SUPABASE_SERVICE_ROLE_KEY` = **must be re-fetched from the original Lovable Cloud dashboard** (not stored in code)
- `SUPABASE_DB_URL` = **must be re-fetched from the original Lovable Cloud dashboard**

> ⚠️ Service role key and DB URL are sensitive — never commit to code. Retrieve them from the source project's Cloud settings and paste into the remix's secret manager.

### Step 5 — Verify
- Login with platform admin: username `wanjalabrighton63` (existing credentials)
- Confirm hospital list, patients, medicines all load
- POS, billing, pharmacy sales should work identically

**Result:** Two frontends, one shared backend, zero data loss. Both apps stay live.

---

## 🔁 OPTION B — Migrate Data Into a New Backend

Use this only if you want **complete isolation** (separate billing, separate user base).

### Step 1 — Export data from THIS project
Run from a machine with `psql` access to the source DB:

```bash
# Get connection string from source Lovable Cloud → Settings → Database
export SOURCE_DB="postgresql://postgres:[PASSWORD]@db.dcihnhwmkqxyfwefekpy.supabase.co:5432/postgres"

# Dump data only (schema is recreated by migrations)
pg_dump "$SOURCE_DB" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --exclude-table=schema_migrations \
  -f brightcare_data.sql
```

### Step 2 — In the remixed project
1. Let Lovable Cloud provision a fresh backend.
2. The migration files in `supabase/migrations/` (32 files, all copied during remix) will rebuild the schema, functions, and seed defaults automatically.
3. Wait until `cloud_status` returns `ACTIVE_HEALTHY`.

### Step 3 — Import data into the new backend
```bash
export TARGET_DB="postgresql://postgres:[NEW_PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres"

# Truncate seeded defaults that the migration created (so import doesn't conflict)
psql "$TARGET_DB" -c "TRUNCATE license_packages, dropdown_options, role_permissions, module_settings, platform_settings RESTART IDENTITY CASCADE;"

# Import
psql "$TARGET_DB" -f brightcare_data.sql
```

### Step 4 — Re-upload storage bucket contents
The `downloads` bucket (public) holds desktop installer ZIPs. Re-upload manually via Cloud → Storage.

### Step 5 — Recreate edge function secrets in the new project
Same list as Option A Step 4, but use the NEW project's values.

### Step 6 — Verify row counts match
Run on both DBs:
```sql
SELECT 'hospitals',COUNT(*) FROM hospitals
UNION ALL SELECT 'staff',COUNT(*) FROM staff
UNION ALL SELECT 'patients',COUNT(*) FROM patients
UNION ALL SELECT 'medicines',COUNT(*) FROM medicines
UNION ALL SELECT 'pharmacy_sales',COUNT(*) FROM pharmacy_sales;
```
Numbers must match.

---

## 📊 Current Production Data Snapshot (as of remix point)

| Table | Rows |
|---|---|
| hospitals | 8 |
| staff | 28 |
| patients | 209 |
| medicines | 1,584 |
| pharmacy_sales | 2,118 |
| consultations | 168 |
| bills | 129 |
| license_packages | 4 |
| license_keys | 4 |
| dropdown_options | 4,730 |
| role_permissions | 7,785 |
| module_settings | 96 |

---

## 🗄️ Complete Database Schema (45 Tables, public schema)

All tables use single-schema multi-tenancy keyed by `hospital_id uuid`. RLS is currently `Allow all` on every table (deferred hardening — see `mem://security/postponed-hardening`). Tenant isolation is enforced at the application layer via `src/lib/safeSupabase.ts`.

### Core Tenancy & Auth
- **hospitals** — tenant root. License state, billing, branding, defaults. PK `id`, unique `slug`.
- **staff** — users per hospital. Username/password (bcrypt via `hash_password()`), role, department. Platform admin: `wanjalabrighton63`.
- **departments** — hospital sub-units.
- **business_hours** — per-day open/close.
- **inactive_days** — closed-day registry.

### Patients & Clinical
- **patients** — demographics, allergies, insurance. Soft-delete via `is_active`.
- **consultations** — visit records, vitals JSONB, diagnosis, status flow `waiting → in_progress → completed`.
- **prescriptions** + **prescription_items** — clinical orders; items can be `medicine` or `service_bundle`.
- **lab_tests** — requested/performed labs with results.
- **lab_consumables**, **lab_service_bundles**, **lab_service_consumables**, **lab_test_consumables** — lab inventory linkage.
- **vitals_records** — inpatient vitals stream.
- **admissions**, **wards**, **beds** — inpatient management.
- **nursing_notes**, **appointments**.

### Pharmacy & POS
- **medicines** — inventory. `cost_price` defaults to ~60% of `price`. FIFO dispensing.
- **pharmacy_sales** + **pharmacy_sale_items** — POS receipts.
- **invoices** + **invoice_items** — supplier invoices for stock receiving.
- **credit_sales** — POS credit balances (WLK- prefix for walk-ins).

### Billing & Finance
- **bills** + **bill_items** — patient billing. Hybrid payment, exact tax lock-in.
- **billing_settings** — per-hospital realtime/cumulative mode.
- **financial_settlements** — staff-to-company reconciliation (cash/mpesa/card/credit/gift/account totals).
- **payment_method_permissions** — RBAC per role × method.

### Licensing & Platform
- **license_packages** — Basic/Standard/Premium tiers, KES pricing, allowed_modules array.
- **license_keys** — generated activation keys.
- **license_audit_log** — package change trail.
- **hospital_addons** — paid extras.
- **platform_settings** — global key/value (support contact, etc.).

### Configuration
- **dropdown_options** — shared catalog with composite unique on `(category, value, COALESCE(hospital_id,...))`. **Critical:** see `mem://architecture/catalog-data-isolation`.
- **module_settings** — per-hospital module enable/disable.
- **role_permissions** — per-hospital role × feature_key matrix (7,785 rows = the RBAC heart).

### Comms & Audit
- **announcements** — targetable banners with priority + expiry.
- **internal_messages** — auto-expire after 6h.
- **notifications** — per-staff inbox.
- **activity_log** — system-wide audit trail.
- **staff_checkins**, **staff_salaries** — HR.

### Database Functions (public schema)
```sql
hash_password(raw_password text) → text       -- bcrypt(10) via pgcrypto
verify_password(raw text, hashed text) → bool  -- constant-time compare
```
Both `IMMUTABLE`, `SECURITY DEFINER`, `search_path = public, extensions`.
Used by `staff-auth` edge function and migrations seeding default `changeme` password.

### Triggers
None. Validation handled in app layer + edge functions (per `mem://important-guidelines`: avoid CHECK constraints with `now()`).

### Realtime Publications
None enabled. All reads use polling via `useOfflineQuery`.

---

## ⚡ Edge Functions (`supabase/functions/`)

### 1. `ai-assistant`
- **Model:** `google/gemini-3-flash-preview` via Lovable AI Gateway
- **Auth:** `verify_jwt = false` (public, but rate-limited via app)
- **Secret used:** `LOVABLE_API_KEY` (auto-provisioned)
- **Purpose:** In-app AI chat helper (`src/components/AIAssistant.tsx`)

### 2. `staff-auth`
- **Auth:** `verify_jwt = false`
- **Secrets used:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Purpose:** Username/password login bypass for `staff` table (since we don't use Supabase Auth). Validates via `verify_password()` DB function, issues session token.
- **Endpoint:** `POST /functions/v1/staff-auth` with `{username, password}`

Both functions auto-deploy on push. **No manual deploy needed.**

---

## 🔐 Secrets (Supabase Edge Runtime)

Already configured in source project. After remix (Option B), recreate:

| Secret | Source | Sensitive |
|---|---|---|
| `LOVABLE_API_KEY` | Auto by Lovable | No (auto) |
| `SUPABASE_URL` | Cloud settings | No |
| `SUPABASE_ANON_KEY` | Cloud settings | No (publishable) |
| `SUPABASE_PUBLISHABLE_KEY` | Cloud settings | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Cloud settings | **YES** |
| `SUPABASE_DB_URL` | Cloud settings | **YES** |

---

## 📦 Storage Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `downloads` | ✅ Yes | Windows desktop installer ZIP distribution (see `mem://infrastructure/distribution-hosting`) |

After remix (Option B): manually re-upload `BrightcareSetup.zip` and any other release artifacts.

---

## 🏗️ Codebase Restoration Notes

These files/folders are **auto-managed by Lovable** — never edit by hand, but verify after remix:
- `src/integrations/supabase/client.ts` — regenerated against backend
- `src/integrations/supabase/types.ts` — regenerated from DB schema
- `.env` — VITE_SUPABASE_* values
- `supabase/config.toml` — `project_id` only (function blocks OK to add)

**Project knowledge to seed in remix** (paste into Knowledge tab):
> Hybrid online (web) + offline (Electron) hospital/POS system. Brand: **Brightcare** (never disclose React/Supabase to end users). High-density QuickBooks-style UI, navy/teal. Single-schema multi-tenancy keyed by `hospital_id`, isolated via `safeSupabase` proxy. Offline-first via `useOfflineQuery` + IndexedDB. M-Pesa STK Push, KES only. Platform admin: `wanjalabrighton63`. RLS deferred — app-layer isolation only.

**Memory files to recreate** (or copy from `mem://index.md` of source — see all entries listed there).

---

## 🚀 Recommended Remix Sequence

1. **Take a fresh DB dump NOW** (Option B step 1) as a permanent safety backup, regardless of which option you choose.
2. **Use Option A** unless you have a strong reason to fork the data.
3. **Test the remix in preview** before publishing — confirm staff login works, patient list loads, POS sale completes end-to-end.
4. **Update `mem://index.md`** in the remix to reflect any divergence.

---

*Last updated: 2026-04-30 — covers schema state at migration `20260415135416`.*
