-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "agentId" INTEGER;

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Agent',
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "facebook" TEXT,
    "messenger" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_slug_idx" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "agents_role_idx" ON "agents"("role");

-- CreateIndex
CREATE INDEX "properties_agentId_idx" ON "properties"("agentId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
