-- Add userId column to notifications
ALTER TABLE `notifications` ADD COLUMN `userId` VARCHAR(191);

-- Add foreign key constraint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Modify the type column to include new enum values (MySQL approach)
ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM('appt','promo','health','claim','admission','signup','service','patient_registered') NOT NULL;
