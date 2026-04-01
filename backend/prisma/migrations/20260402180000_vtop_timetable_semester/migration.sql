-- Multi-semester timetable: tag rows with VTOP dropdown value + label
ALTER TABLE "VtopTimetable" ADD COLUMN IF NOT EXISTS "semesterSubId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "VtopTimetable" ADD COLUMN IF NOT EXISTS "semesterLabel" TEXT;

UPDATE "VtopTimetable" SET "semesterSubId" = '' WHERE "semesterSubId" IS NULL;

DROP INDEX IF EXISTS "VtopTimetable_userId_slot_dayOfWeek_key";

CREATE UNIQUE INDEX "VtopTimetable_userId_semesterSubId_slot_dayOfWeek_key"
  ON "VtopTimetable"("userId", "semesterSubId", "slot", "dayOfWeek");

CREATE INDEX IF NOT EXISTS "VtopTimetable_userId_semesterSubId_idx"
  ON "VtopTimetable"("userId", "semesterSubId");
