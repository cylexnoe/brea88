ALTER TABLE "properties"
ADD COLUMN "developer" TEXT,
ADD COLUMN "bankFinancing" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "description" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "totalcp" TEXT;

CREATE INDEX "properties_developer_idx" ON "properties"("developer");
