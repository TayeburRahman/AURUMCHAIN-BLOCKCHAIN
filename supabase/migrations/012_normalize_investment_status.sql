-- 012_normalize_investment_status.sql
-- Migration to normalize investment status to 'pending', 'approved', 'rejected'

DO $$
BEGIN
    -- 1. Create new ENUM if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investment_status_v2') THEN
        CREATE TYPE investment_status_v2 AS ENUM ('pending', 'approved', 'rejected');
    END IF;

    -- 2. Add new explicit timestamp columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='approved_at') THEN
        ALTER TABLE public.investments ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='rejected_at') THEN
        ALTER TABLE public.investments ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;

    -- 3. Add new status column safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investments' AND column_name='status_v2') THEN
        ALTER TABLE public.investments ADD COLUMN status_v2 investment_status_v2 DEFAULT 'pending' NOT NULL;
        
        -- 4. Map legacy data to new unified statuses
        UPDATE public.investments
        SET 
            status_v2 = CASE
                WHEN status::text = 'completed' THEN 'approved'::investment_status_v2
                WHEN status::text IN ('cancelled', 'refunded') THEN 'rejected'::investment_status_v2
                ELSE 'pending'::investment_status_v2
            END,
            approved_at = CASE 
                WHEN status::text = 'completed' THEN COALESCE(completed_at, updated_at) 
                ELSE approved_at 
            END,
            rejected_at = CASE 
                WHEN status::text IN ('cancelled', 'refunded') THEN COALESCE(updated_at, NOW()) 
                ELSE rejected_at 
            END;

        -- 5. Safely swap columns to maintain API compatibility
        ALTER TABLE public.investments RENAME COLUMN status TO status_legacy;
        ALTER TABLE public.investments RENAME COLUMN status_v2 TO status;
    END IF;
END $$;
