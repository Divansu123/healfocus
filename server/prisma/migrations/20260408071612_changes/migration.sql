/*
  Warnings:

  - The values [discharged] on the enum `admissions_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `admissions` MODIFY `status` ENUM('pending', 'approved', 'rejected', 'reviewing') NOT NULL DEFAULT 'pending';
