-- AlterTable (idempotent - only add column if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions' 
        AND column_name = 'test_results'
    ) THEN
        ALTER TABLE "public"."submissions" ADD COLUMN "test_results" JSONB;
    END IF;
END $$;
