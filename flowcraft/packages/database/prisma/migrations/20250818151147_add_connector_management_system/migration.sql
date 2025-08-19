/*
  Warnings:

  - You are about to drop the column `category` on the `connectors` table. All the data in the column will be lost.
  - You are about to drop the column `definition` on the `connectors` table. All the data in the column will be lost.
  - The `version` column on the `connectors` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `configuration` to the `connectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `connectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `connectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `connectors` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "connectors_name_key";

-- AlterTable
ALTER TABLE "connectors" DROP COLUMN "category",
DROP COLUMN "definition",
ADD COLUMN     "configuration" JSONB NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "version",
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "connector_credentials" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "configurationSchema" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_logs" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connector_credentials_connectorId_idx" ON "connector_credentials"("connectorId");

-- CreateIndex
CREATE INDEX "connector_templates_type_idx" ON "connector_templates"("type");

-- CreateIndex
CREATE INDEX "connector_templates_category_idx" ON "connector_templates"("category");

-- CreateIndex
CREATE INDEX "connector_templates_isPublic_idx" ON "connector_templates"("isPublic");

-- CreateIndex
CREATE INDEX "connector_logs_connectorId_idx" ON "connector_logs"("connectorId");

-- CreateIndex
CREATE INDEX "connector_logs_createdAt_idx" ON "connector_logs"("createdAt");

-- CreateIndex
CREATE INDEX "connectors_organizationId_idx" ON "connectors"("organizationId");

-- CreateIndex
CREATE INDEX "connectors_type_idx" ON "connectors"("type");

-- CreateIndex
CREATE INDEX "connectors_isActive_idx" ON "connectors"("isActive");

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_credentials" ADD CONSTRAINT "connector_credentials_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_templates" ADD CONSTRAINT "connector_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_templates" ADD CONSTRAINT "connector_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_logs" ADD CONSTRAINT "connector_logs_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
