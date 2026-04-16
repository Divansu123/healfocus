-- AlterTable: Split vitals into 4 individual fields in opd_patients
ALTER TABLE `opd_patients`
  ADD COLUMN `weight`            VARCHAR(191) NULL,
  ADD COLUMN `bloodPressure`     VARCHAR(191) NULL,
  ADD COLUMN `temperature`       VARCHAR(191) NULL,
  ADD COLUMN `generalAppearance` VARCHAR(191) NULL;

-- Optionally drop the old vitals column (run after data migration if needed)
-- ALTER TABLE `opd_patients` DROP COLUMN `vitals`;
