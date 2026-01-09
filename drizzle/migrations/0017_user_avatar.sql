-- Add avatar columns to users table
ALTER TABLE `users` ADD COLUMN `avatarUrl` TEXT;
ALTER TABLE `users` ADD COLUMN `avatarType` ENUM('initials', 'boring', 'upload') DEFAULT 'initials';
