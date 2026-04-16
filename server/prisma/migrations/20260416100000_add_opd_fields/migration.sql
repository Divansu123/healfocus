-- AlterTable: Add vitals, paymentMode, opdFee, followUpDate to opd_patients
ALTER TABLE `opd_patients`
  ADD COLUMN `vitals` VARCHAR(191) NULL,
  ADD COLUMN `paymentMode` VARCHAR(191) NULL,
  ADD COLUMN `opdFee` DOUBLE NULL,
  ADD COLUMN `followUpDate` VARCHAR(191) NULL;
