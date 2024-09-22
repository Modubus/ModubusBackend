/*
  Warnings:

  - You are about to drop the column `node_id` on the `UserFavorite` table. All the data in the column will be lost.
  - Added the required column `end_node_id` to the `UserFavorite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_node_id` to the `UserFavorite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `UserFavorite` DROP COLUMN `node_id`,
    ADD COLUMN `end_node_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `start_node_id` VARCHAR(191) NOT NULL;
