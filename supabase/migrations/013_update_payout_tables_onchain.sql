-- Migration: Update payout tables for on-chain epoch tracking

ALTER TABLE public.payout_cycles 
ADD COLUMN IF NOT EXISTS epoch_id BIGINT,
ADD COLUMN IF NOT EXISTS profit_per_token DECIMAL(15, 8);

-- Add unique constraint so we don't duplicate on-chain epochs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_epoch'
    ) THEN
        ALTER TABLE public.payout_cycles ADD CONSTRAINT unique_project_epoch UNIQUE (project_id, epoch_id);
    END IF;
END $$;

ALTER TABLE public.payout_records 
ADD COLUMN IF NOT EXISTS epoch_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_payout_record_epoch'
    ) THEN
        ALTER TABLE public.payout_records ADD CONSTRAINT unique_payout_record_epoch UNIQUE (project_id, epoch_id, user_id);
    END IF;
END $$;
