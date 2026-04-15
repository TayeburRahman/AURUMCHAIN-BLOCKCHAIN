-- Migration: Add mint and authority fields to projects table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS mint_address TEXT,
  ADD COLUMN IF NOT EXISTS mint_authority_revoked BOOLEAN DEFAULT FALSE;

-- Update database types in comments or documentation (manual step usually)
-- These fields are critical for sync with the project_registry Anchor program.
