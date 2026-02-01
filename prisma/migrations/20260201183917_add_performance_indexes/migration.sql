-- DropIndex
DROP INDEX "public"."questions_id_key";

-- AlterTable
ALTER TABLE "public"."questions" ALTER COLUMN "topics" SET DEFAULT ARRAY[]::TEXT[];
