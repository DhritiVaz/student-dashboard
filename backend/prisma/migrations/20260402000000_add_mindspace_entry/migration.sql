-- CreateTable
CREATE TABLE "MindspaceEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "storedName" TEXT,
    "originalName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MindspaceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MindspaceEntry_userId_idx" ON "MindspaceEntry"("userId");

-- CreateIndex
CREATE INDEX "MindspaceEntry_userId_createdAt_idx" ON "MindspaceEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MindspaceEntry_deletedAt_idx" ON "MindspaceEntry"("deletedAt");

-- AddForeignKey
ALTER TABLE "MindspaceEntry" ADD CONSTRAINT "MindspaceEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
