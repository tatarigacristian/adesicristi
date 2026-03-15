-- Split intro into intro_short (for QR card) and intro_long (for invitation page)
ALTER TABLE guests ADD COLUMN intro_short VARCHAR(200) NULL AFTER intro;
ALTER TABLE guests ADD COLUMN intro_long TEXT NULL AFTER intro_short;

-- Migrate existing intro data to intro_long
UPDATE guests SET intro_long = intro WHERE intro IS NOT NULL;

-- Drop old intro column
ALTER TABLE guests DROP COLUMN intro;
