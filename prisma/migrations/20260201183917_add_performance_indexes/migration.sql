-- DropIndex (only if exists) - silently ignore if doesn't exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = 'questions_id_key'
    ) THEN
        DROP INDEX "public"."questions_id_key";
    END IF;
END $$;

-- AlterTable (idempotent - only alter if default is different)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'questions' 
        AND column_name = 'topics'
        AND column_default IS DISTINCT FROM 'ARRAY[]::text[]'
    ) THEN
        ALTER TABLE "public"."questions" ALTER COLUMN "topics" SET DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;
