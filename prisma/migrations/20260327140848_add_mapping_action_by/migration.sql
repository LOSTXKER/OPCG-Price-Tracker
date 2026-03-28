-- AlterTable
ALTER TABLE "YuyuteiMapping" ADD COLUMN     "actionAt" TIMESTAMP(3),
ADD COLUMN     "actionBy" TEXT;

-- AddForeignKey
ALTER TABLE "YuyuteiMapping" ADD CONSTRAINT "YuyuteiMapping_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
