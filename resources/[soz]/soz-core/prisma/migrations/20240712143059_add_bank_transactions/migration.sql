-- CreateTable
CREATE TABLE `bank_transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `emitterAccount` VARCHAR(50) NOT NULL,
    `emitterName` VARCHAR(50) NOT NULL,
    `targetAccount` VARCHAR(50) NOT NULL,
    `targetName` VARCHAR(50) NOT NULL,
    `amount` BIGINT NOT NULL DEFAULT 0,
    `date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `emitterAccount`(`emitterAccount`),
    INDEX `targetAccount`(`targetAccount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
