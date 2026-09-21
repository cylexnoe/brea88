-- CreateTable
CREATE TABLE "property_submissions" (
    "id" SERIAL NOT NULL,
    "submissionToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Review',
    "submittedByName" TEXT NOT NULL,
    "submittedByEmail" TEXT,
    "submittedByPhone" TEXT,
    "submittedByRole" TEXT,
    "companyName" TEXT,
    "agentId" INTEGER,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "category" TEXT,
    "propertyType" TEXT,
    "houseType" TEXT,
    "storey" TEXT,
    "price" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "beds" INTEGER,
    "baths" INTEGER,
    "sqft" DOUBLE PRECISION,
    "lotArea" DOUBLE PRECISION,
    "developer" TEXT,
    "totalcp" TEXT,
    "bankFinancing" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "videoUrl" TEXT,
    "image" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "publishedPropertyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_feedback" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "rating" INTEGER,
    "experience" TEXT,
    "difficultPart" TEXT,
    "suggestions" TEXT,
    "submittedByName" TEXT,
    "submittedByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_submissions_submissionToken_key" ON "property_submissions"("submissionToken");

-- CreateIndex
CREATE UNIQUE INDEX "property_submissions_publishedPropertyId_key" ON "property_submissions"("publishedPropertyId");

-- CreateIndex
CREATE INDEX "property_submissions_status_idx" ON "property_submissions"("status");

-- CreateIndex
CREATE INDEX "property_submissions_submissionToken_idx" ON "property_submissions"("submissionToken");

-- CreateIndex
CREATE INDEX "property_submissions_submittedByEmail_idx" ON "property_submissions"("submittedByEmail");

-- CreateIndex
CREATE INDEX "property_submissions_agentId_idx" ON "property_submissions"("agentId");

-- CreateIndex
CREATE INDEX "property_submissions_createdAt_idx" ON "property_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "submission_feedback_submissionId_idx" ON "submission_feedback"("submissionId");

-- CreateIndex
CREATE INDEX "submission_feedback_rating_idx" ON "submission_feedback"("rating");

-- CreateIndex
CREATE INDEX "submission_feedback_createdAt_idx" ON "submission_feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "property_submissions" ADD CONSTRAINT "property_submissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "property_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
