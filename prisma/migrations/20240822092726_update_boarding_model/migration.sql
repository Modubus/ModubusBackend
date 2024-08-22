-- CreateTable
CREATE TABLE `Boarding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `startStation` VARCHAR(191) NOT NULL,
    `endStation` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Boarding_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Boarding` ADD CONSTRAINT `Boarding_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `Bus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boarding` ADD CONSTRAINT `Boarding_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
