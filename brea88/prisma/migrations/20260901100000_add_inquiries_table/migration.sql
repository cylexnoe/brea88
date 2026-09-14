-- Repair migration for schema changes that existed in the database
-- but were missing from the committed Prisma migration history.

-- Add fields that exist in the Agent Prisma model but were missing
-- from the original add_agents migration.
ALTER TABLE "agents"
ADD COLUMN "lastSeen" TIMESTAMP(3),
ADD COLUMN "address" TEXT;

-- The Agent model has an index on lastSeen.
CREATE INDEX "agents_lastSeen_idx" ON "agents"("lastSeen");

-- Create the inquiries table that existed in the Prisma schema
-- but was missing from the migration history.
CREATE TABLE "inquiries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "agentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- Indexes required by the Inquiry Prisma model.
CREATE INDEX "inquiries_propertyId_idx" ON "inquiries"("propertyId");
CREATE INDEX "inquiries_agentId_idx" ON "inquiries"("agentId");
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- Foreign key from inquiries to agents.
ALTER TABLE "inquiries"
ADD CONSTRAINT "inquiries_agentId_fkey"
FOREIGN KEY ("agentId")
REFERENCES "agents"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Foreign key from inquiries to properties.
ALTER TABLE "inquiries"
ADD CONSTRAINT "inquiries_propertyId_fkey"
FOREIGN KEY ("propertyId")
REFERENCES "properties"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;