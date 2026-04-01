-- CreateTable
CREATE TABLE "VtopStudentMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cgpaFromPortal" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VtopStudentMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VtopSemesterMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "semesterLabel" TEXT NOT NULL,
    "gpaFromPortal" DOUBLE PRECISION,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VtopSemesterMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VtopStudentMetrics_userId_key" ON "VtopStudentMetrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VtopSemesterMetrics_userId_semesterLabel_key" ON "VtopSemesterMetrics"("userId", "semesterLabel");

-- CreateIndex
CREATE INDEX "VtopSemesterMetrics_userId_idx" ON "VtopSemesterMetrics"("userId");

-- AddForeignKey
ALTER TABLE "VtopStudentMetrics" ADD CONSTRAINT "VtopStudentMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VtopSemesterMetrics" ADD CONSTRAINT "VtopSemesterMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable VtopGrade: extra columns + composite unique
ALTER TABLE "VtopGrade" ADD COLUMN "faculty" TEXT;
ALTER TABLE "VtopGrade" ADD COLUMN "slot" TEXT;
ALTER TABLE "VtopGrade" ADD COLUMN "category" TEXT;

UPDATE "VtopGrade" SET "semesterLabel" = '' WHERE "semesterLabel" IS NULL;

ALTER TABLE "VtopGrade" ALTER COLUMN "semesterLabel" SET DEFAULT '';
ALTER TABLE "VtopGrade" ALTER COLUMN "semesterLabel" SET NOT NULL;

ALTER TABLE "VtopGrade" DROP CONSTRAINT IF EXISTS "VtopGrade_userId_courseCode_key";

CREATE UNIQUE INDEX "VtopGrade_userId_semesterLabel_courseCode_key" ON "VtopGrade"("userId", "semesterLabel", "courseCode");
