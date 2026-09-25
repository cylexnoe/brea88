-- CreateTable
CREATE TABLE "property_units" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitType" TEXT NOT NULL,
    "unitName" TEXT,
    "price" TEXT NOT NULL,
    "lotArea" DOUBLE PRECISION,
    "floorArea" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_unit_images" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_unit_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_units_propertyId_idx" ON "property_units"("propertyId");

-- CreateIndex
CREATE INDEX "property_units_unitType_idx" ON "property_units"("unitType");

-- CreateIndex
CREATE INDEX "property_unit_images_unitId_idx" ON "property_unit_images"("unitId");

-- CreateIndex
CREATE INDEX "property_unit_images_unitId_sortOrder_idx" ON "property_unit_images"("unitId", "sortOrder");

-- AddForeignKey
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_unit_images" ADD CONSTRAINT "property_unit_images_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "property_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
