-- Add attachments column to medical_records table
-- Stores comma-separated file paths of uploaded attachments
ALTER TABLE `medical_records`
  ADD COLUMN `attachments` TEXT NULL;
