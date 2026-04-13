-- Migration: Add blockchain linkage fields to projects table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS blockchain_signature TEXT,
  ADD COLUMN IF NOT EXISTS blockchain_project_id INTEGER;

-- Allow public (unauthenticated) read access for the user-facing /projects page
-- Only exposes non-sensitive fields; no PII is in the projects table
CREATE POLICY "Public can view visible projects"
  ON public.projects FOR SELECT
  USING (status IN ('funding', 'active', 'funded', 'completed', 'draft'));
