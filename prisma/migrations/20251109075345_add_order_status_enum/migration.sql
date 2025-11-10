/*
  Warnings:

  - You are about to drop the column `isDelivered` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "orderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isDelivered",
DROP COLUMN "isPaid",
ADD COLUMN     "status" "orderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';
