-- AlterEnum
ALTER TYPE "orderStatus" ADD VALUE 'CREATED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cartId" TEXT;
