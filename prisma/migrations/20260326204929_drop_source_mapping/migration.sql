/*
  Warnings:

  - You are about to drop the `SourceMapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SourceMapping" DROP CONSTRAINT "SourceMapping_cardId_fkey";

-- DropTable
DROP TABLE "SourceMapping";
