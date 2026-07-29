# BrightCare — Database Data Export (committed in repo)

Snapshot taken: 2026-04-30 from Supabase project `dcihnhwmkqxyfwefekpy`.

This folder contains **every row** of the live production database as CSV files,
plus a one-shot restore script. It lives inside the codebase so a remix carries
the data with it automatically.

## Files
- `*.csv` — one file per table (45 tables, public schema).
- `_summary.csv` — table → row count.
- `FULL_DATA_DUMP.sql` — TRUNCATE + `\COPY` restore for every table, wrapped in a transaction with `session_replication_role = replica` so FK/triggers don't block the load.

## Restore into a fresh backend
1. Let the new Lovable Cloud backend run all migrations (schema must exist).
2. From the Supabase dashboard → Settings → Database, copy the connection string.
3. From this folder:
   ```bash
   export TARGET_DB="postgresql://postgres:[PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres"
   psql "$TARGET_DB" -f FULL_DATA_DUMP.sql
   ```
4. Verify with `_summary.csv` row counts.

## Notes
- Staff passwords are bcrypt hashes (`password_hash` column) — they remain valid after restore because `verify_password()` is reproduced by the migrations.
- Default platform admin: username `wanjalabrighton63`.
- Storage bucket files (e.g., `downloads/BrightcareSetup.zip`) are NOT in this folder — re-upload via dashboard.
- Edge function secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) must be re-added to the new project's secret manager.

See `../REMIX_MIGRATION_GUIDE.md` for the full migration playbook.