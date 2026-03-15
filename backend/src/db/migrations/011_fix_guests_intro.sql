ALTER TABLE guests ADD COLUMN intro_short VARCHAR(200) NULL;
ALTER TABLE guests ADD COLUMN intro_long TEXT NULL;
UPDATE guests SET intro_long = intro WHERE intro IS NOT NULL;
ALTER TABLE guests DROP COLUMN intro;
