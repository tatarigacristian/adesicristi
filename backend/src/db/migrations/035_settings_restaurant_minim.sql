-- Add minimum menus and menu price percentage settings
ALTER TABLE wedding_settings ADD COLUMN nr_minim_meniuri INT NULL DEFAULT NULL;
ALTER TABLE wedding_settings ADD COLUMN procent_pret_meniu INT NULL DEFAULT 100;
