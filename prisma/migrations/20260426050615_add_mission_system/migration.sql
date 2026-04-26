-- CreateEnum
CREATE TYPE "MissionCategory" AS ENUM ('DAILY', 'MONTHLY', 'SPECIAL');

-- CreateEnum
CREATE TYPE "MissionTrackType" AS ENUM ('AUTO_PATH', 'MANUAL', 'ACTION_COUNT');

-- CreateEnum
CREATE TYPE "MissionSlotType" AS ENUM ('CORE', 'DAY_OF_WEEK', 'RANDOM_POOL', 'FIXED_DATE', 'SEQUENTIAL');

-- CreateEnum
CREATE TYPE "MissionBonusRequirement" AS ENUM ('ALL_COMPLETE', 'COUNT_COMPLETE', 'STREAK_DAYS');

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "descriptionTh" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Circle',
    "category" "MissionCategory" NOT NULL DEFAULT 'DAILY',
    "trackType" "MissionTrackType" NOT NULL DEFAULT 'AUTO_PATH',
    "conditions" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionScheduleRule" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "slotType" "MissionSlotType" NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDates" JSONB,
    "poolGroup" TEXT,
    "poolPickCount" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionBonusRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "category" "MissionCategory" NOT NULL,
    "requirement" "MissionBonusRequirement" NOT NULL,
    "requirementValue" INTEGER NOT NULL DEFAULT 1,
    "rewards" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionBonusRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionTemplate_code_key" ON "MissionTemplate"("code");

-- CreateIndex
CREATE INDEX "MissionTemplate_category_isActive_idx" ON "MissionTemplate"("category", "isActive");

-- CreateIndex
CREATE INDEX "MissionScheduleRule_slotType_isActive_idx" ON "MissionScheduleRule"("slotType", "isActive");

-- CreateIndex
CREATE INDEX "MissionScheduleRule_templateId_idx" ON "MissionScheduleRule"("templateId");

-- CreateIndex
CREATE INDEX "MissionBonusRule_category_isActive_idx" ON "MissionBonusRule"("category", "isActive");

-- AddForeignKey
ALTER TABLE "MissionScheduleRule" ADD CONSTRAINT "MissionScheduleRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
