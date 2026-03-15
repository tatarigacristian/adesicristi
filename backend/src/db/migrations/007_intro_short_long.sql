-- Split intro into intro_short (for QR card) and intro_long (for invitation page)
ALTER TABLE guests ADD COLUMN intro_short VARCHAR(200) NULL;
ALTER TABLE guests ADD COLUMN intro_long TEXT NULL;

-- Migrate existing intro data to intro_long (only if intro column still exists)
-- This will be silently ignored if intro column was already dropped
UPDATE guests SET intro_long = intro WHERE intro IS NOT NULL;

-- Drop old intro column
ALTER TABLE guests DROP COLUMN intro;
