/*
  Warnings:

  - You are about to drop the column `code` on the `Bus` table. All the data in the column will be lost.
  - You are about to drop the column `routmn` on the `UserFavorite` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `BusCompany` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `routnm` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleno` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `BusCompany` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routnm` to the `UserFavorite` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Bus_code_key` ON `Bus`;

-- AlterTable
ALTER TABLE `Bus` DROP COLUMN `code`,
    ADD COLUMN `routnm` VARCHAR(191) NOT NULL,
    ADD COLUMN `vehicleno` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `BusCompany` ADD COLUMN `code` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `UserFavorite` DROP COLUMN `routmn`,
    ADD COLUMN `routnm` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `BusCompany_code_key` ON `BusCompany`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
