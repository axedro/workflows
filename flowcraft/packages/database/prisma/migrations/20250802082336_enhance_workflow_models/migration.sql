/*
  Warnings:

  - You are about to drop the column `version` on the `workflow_versions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workflowId,versionNumber]` on the table `workflow_versions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `workflow_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `workflow_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `workflow_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionNumber` to the `workflow_versions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workflow_templates" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "workflow_versions" DROP COLUMN "version",
ADD COLUMN     "changelog" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "workflow_templates_category_idx" ON "workflow_templates"("category");

-- CreateIndex
CREATE INDEX "workflow_templates_isPublic_idx" ON "workflow_templates"("isPublic");

-- CreateIndex
CREATE INDEX "workflow_templates_organizationId_idx" ON "workflow_templates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_versions_workflowId_versionNumber_key" ON "workflow_versions"("workflowId", "versionNumber");

-- CreateIndex
CREATE INDEX "workflows_organizationId_idx" ON "workflows"("organizationId");

-- CreateIndex
CREATE INDEX "workflows_status_idx" ON "workflows"("status");

-- CreateIndex
CREATE INDEX "workflows_createdAt_idx" ON "workflows"("createdAt");

-- AddForeignKey
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
