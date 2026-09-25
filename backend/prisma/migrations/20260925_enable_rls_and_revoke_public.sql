-- ==============================================================================
-- Migration: Enable Row Level Security (RLS) on all public tables & Revoke PostgREST Public Access
-- Fixes Supabase Security Linter:
--   1. rls_disabled_in_public
--   2. sensitive_columns_exposed
-- ==============================================================================

-- 1. Enable Row Level Security on all existing tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Revoke all privileges from anon and authenticated roles on public schema
-- (This ensures Supabase PostgREST API cannot read/write sensitive tables without explicit policies)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- 3. Alter default privileges so any future tables/sequences/routines are also secured automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;
