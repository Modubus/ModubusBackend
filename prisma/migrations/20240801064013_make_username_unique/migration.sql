/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Bus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `operation` to the `Bus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
/*ALTER TABLE `Bus` ADD COLUMN `operation` BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Bus_code_key` ON `Bus`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
*/