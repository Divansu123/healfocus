-- Add new fields to discharge_summaries
ALTER TABLE `discharge_summaries` ADD COLUMN IF NOT EXISTS `followUpDate` VARCHAR(191) NULL;
ALTER TABLE `discharge_summaries` ADD COLUMN IF NOT EXISTS `attendingDoctor` VARCHAR(191) NULL;
ALTER TABLE `discharge_summaries` ADD COLUMN IF NOT EXISTS `proceduresDone` TEXT NULL;
ALTER TABLE `discharge_summaries` ADD COLUMN IF NOT EXISTS `medicinesAtDischarge` TEXT NULL;

-- Add new fields to indoor_bills
ALTER TABLE `indoor_bills` ADD COLUMN IF NOT EXISTS `patientAge` INT NULL;
ALTER TABLE `indoor_bills` ADD COLUMN IF NOT EXISTS `paymentMode` VARCHAR(191) NULL DEFAULT 'Cashless';

-- Modify admissions urgency enum to allow semi_urgent
-- (MySQL ENUM modify)
ALTER TABLE `admissions` MODIFY COLUMN `urgency` ENUM('planned','urgent','emergency','semi_urgent') NOT NULL DEFAULT 'planned';