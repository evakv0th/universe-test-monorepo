/*
  Warnings:

  - The `purchaseAmount` column on the `FacebookEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `purchaseAmount` column on the `TiktokEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "FacebookEvent" DROP COLUMN "purchaseAmount",
ADD COLUMN     "purchaseAmount" INTEGER;

-- AlterTable
ALTER TABLE "TiktokEvent" DROP COLUMN "purchaseAmount",
ADD COLUMN     "purchaseAmount" INTEGER;
