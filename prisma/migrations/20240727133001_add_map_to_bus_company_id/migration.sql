/*
  Warnings:

  - You are about to drop the column `busCompanyId` on the `Bus` table. All the data in the column will be lost.
  - Added the required column `bus_company_id` to the `Bus` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Bus` DROP FOREIGN KEY `Bus_busCompanyId_fkey`;

-- AlterTable
ALTER TABLE `Bus` DROP COLUMN `busCompanyId`,
    ADD COLUMN `bus_company_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Bus` ADD CONSTRAINT `Bus_bus_company_id_fkey` FOREIGN KEY (`bus_company_id`) REFERENCES `BusCompany`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
