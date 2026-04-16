-- AlterTable insurance_cards: add attachments column
ALTER TABLE `insurance_cards` ADD COLUMN `attachments` TEXT NULL;

-- AlterTable insurance_claims: add attachments column
ALTER TABLE `insurance_claims` ADD COLUMN `attachments` TEXT NULL;
