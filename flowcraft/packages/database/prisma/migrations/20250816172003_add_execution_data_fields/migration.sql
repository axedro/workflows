-- AlterTable
ALTER TABLE "execution_nodes" ADD COLUMN     "dataSchema" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "performance" JSONB,
ADD COLUMN     "transformations" JSONB;

-- AlterTable
ALTER TABLE "executions" ADD COLUMN     "dataFlow" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "summary" JSONB;
