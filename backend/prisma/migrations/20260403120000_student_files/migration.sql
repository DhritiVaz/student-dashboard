-- CreateTable
CREATE TABLE "StudentFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "storedName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "courseId" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentFile_userId_idx" ON "StudentFile"("userId");

-- CreateIndex
CREATE INDEX "StudentFile_courseId_idx" ON "StudentFile"("courseId");

-- CreateIndex
CREATE INDEX "StudentFile_deletedAt_idx" ON "StudentFile"("deletedAt");

-- AddForeignKey
ALTER TABLE "StudentFile" ADD CONSTRAINT "StudentFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFile" ADD CONSTRAINT "StudentFile_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
