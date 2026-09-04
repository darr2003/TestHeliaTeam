-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('diario', 'semanal');
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "legal_name" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "relation_start" DATE,
ADD COLUMN     "website" TEXT;
-- CreateTable
CREATE TABLE "competitors" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" "ReportType" NOT NULL,
    "storage_key" TEXT,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "competitors_account_id_name_key" ON "competitors"("account_id", "name");
-- CreateIndex
CREATE INDEX "reports_account_id_date_idx" ON "reports"("account_id", "date");
-- CreateIndex
CREATE UNIQUE INDEX "reports_account_id_date_type_key" ON "reports"("account_id", "date", "type");
-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
