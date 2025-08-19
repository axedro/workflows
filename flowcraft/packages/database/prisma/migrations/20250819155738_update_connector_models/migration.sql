/*
  Warnings:

  - You are about to drop the `connector_templates` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,organizationId]` on the table `connectors` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `level` on the `connector_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "connector_templates" DROP CONSTRAINT "connector_templates_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "connector_templates" DROP CONSTRAINT "connector_templates_organizationId_fkey";

-- DropIndex
DROP INDEX "connector_credentials_connectorId_idx";

-- DropIndex
DROP INDEX "connector_logs_connectorId_idx";

-- DropIndex
DROP INDEX "connector_logs_createdAt_idx";

-- DropIndex
DROP INDEX "connectors_isActive_idx";

-- DropIndex
DROP INDEX "connectors_organizationId_idx";

-- DropIndex
DROP INDEX "connectors_type_idx";

-- AlterTable
ALTER TABLE "connector_logs" DROP COLUMN "level",
ADD COLUMN     "level" TEXT NOT NULL;

-- DropTable
DROP TABLE "connector_templates";

-- CreateIndex
CREATE UNIQUE INDEX "connectors_name_organizationId_key" ON "connectors"("name", "organizationId");
