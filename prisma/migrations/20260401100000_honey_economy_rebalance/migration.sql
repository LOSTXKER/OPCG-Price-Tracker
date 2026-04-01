-- Add new HoneyActionType enum values for economy rebalance
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'LEVEL_UP';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'WEEKLY_BONUS';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'LEADERBOARD_REWARD';
