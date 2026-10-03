-- CreateEnum
CREATE TYPE "VocabularyStatus" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MASTERED');

-- CreateEnum
CREATE TYPE "PracticeSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PracticeSessionType" AS ENUM ('RECOMMENDED', 'MISTAKES', 'VOCABULARY');

-- AlterTable
ALTER TABLE "DailyGoal" ADD COLUMN     "completedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetMinutes" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "Mistake" ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "practiceSessionId" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "UserVocabulary" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "exposureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "incorrectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "VocabularyStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "XPTransaction" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" "PracticeSessionType" NOT NULL DEFAULT 'RECOMMENDED',
    "status" "PracticeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "exerciseCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyType" "CurrencyType" NOT NULL DEFAULT 'GEMS',
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 100,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT true,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeSession_userId_status_idx" ON "PracticeSession"("userId", "status");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_createdAt_idx" ON "PracticeSession"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyLedger_idempotencyKey_key" ON "CurrencyLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CurrencyLedger_userId_createdAt_idx" ON "CurrencyLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserQuest_userId_isCompleted_idx" ON "UserQuest"("userId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuest_userId_questId_key" ON "UserQuest"("userId", "questId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Mistake_userId_isResolved_idx" ON "Mistake"("userId", "isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "XPTransaction_idempotencyKey_key" ON "XPTransaction"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyLedger" ADD CONSTRAINT "CurrencyLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
