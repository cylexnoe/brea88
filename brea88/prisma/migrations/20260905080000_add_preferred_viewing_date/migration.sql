ALTER TABLE "inquiries" ADD COLUMN "preferredViewingDate" TIMESTAMP(3);

CREATE INDEX "inquiries_preferredViewingDate_idx" ON "inquiries"("preferredViewingDate");
