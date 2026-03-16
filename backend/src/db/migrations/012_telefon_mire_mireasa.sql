-- Add phone numbers for bride and groom
ALTER TABLE wedding_settings ADD COLUMN telefon_mireasa VARCHAR(20) DEFAULT NULL;
ALTER TABLE wedding_settings ADD COLUMN telefon_mire VARCHAR(20) DEFAULT NULL;
