DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvisorRole') THEN
    CREATE TYPE "AdvisorRole" AS ENUM ('DEVELOPER', 'MANAGEMENT', 'AGENT');
  END IF;
END
$$;

ALTER TABLE "Advisor"
ADD COLUMN IF NOT EXISTS "role" "AdvisorRole" NOT NULL DEFAULT 'AGENT';

UPDATE "Advisor"
SET "role" = 'DEVELOPER'
WHERE "email" = 'admin@agencia.com';
