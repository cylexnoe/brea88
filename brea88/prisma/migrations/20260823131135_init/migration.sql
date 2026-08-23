-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "beds" INTEGER,
    "baths" INTEGER,
    "sqft" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_tag_idx" ON "properties"("tag");

-- CreateIndex
CREATE INDEX "properties_location_idx" ON "properties"("location");
