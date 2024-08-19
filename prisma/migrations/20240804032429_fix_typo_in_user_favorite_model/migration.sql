/*
  Warnings:

  - You are about to drop the column `routmn` on the `UserFavorite` table. All the data in the column will be lost.
  - Added the required column `routnm` to the `UserFavorite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `UserFavorite` DROP COLUMN `routmn`,
    ADD COLUMN `routnm` VARCHAR(191) NOT NULL;
