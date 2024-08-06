/*
  Warnings:

  - Added the required column `cityCode` to the `BusCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BusCompany` ADD COLUMN `cityCode` VARCHAR(191) NOT NULL;
