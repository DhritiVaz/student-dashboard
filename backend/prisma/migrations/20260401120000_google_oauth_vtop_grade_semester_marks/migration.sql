-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;
ALTER TABLE "User" ADD COLUMN "imageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- AlterTable
ALTER TABLE "VtopGrade" ADD COLUMN "semesterLabel" TEXT;

-- CreateIndex
CREATE INDEX "VtopGrade_userId_semesterLabel_idx" ON "VtopGrade"("userId", "semesterLabel");

-- CreateTable
CREATE TABLE "VtopMark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "scored" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VtopMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VtopMark_userId_courseCode_component_key" ON "VtopMark"("userId", "courseCode", "component");

-- CreateIndex
CREATE INDEX "VtopMark_userId_idx" ON "VtopMark"("userId");

-- CreateIndex
CREATE INDEX "VtopMark_userId_courseCode_idx" ON "VtopMark"("userId", "courseCode");

-- AddForeignKey
ALTER TABLE "VtopMark" ADD CONSTRAINT "VtopMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
