-- AlterTable
ALTER TABLE "properties"
ADD COLUMN "category" TEXT,
ADD COLUMN "propertyType" TEXT,
ADD COLUMN "houseType" TEXT,
ADD COLUMN "storey" TEXT;

-- CreateIndex
CREATE INDEX "properties_category_idx"
ON "properties"("category");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx"
ON "properties"("propertyType");
