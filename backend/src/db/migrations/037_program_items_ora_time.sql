ALTER TABLE program_items ADD COLUMN ora_time TIME NULL;
UPDATE program_items SET ora_time = CAST(ora AS TIME) WHERE ora IS NOT NULL AND ora <> '';
ALTER TABLE program_items DROP COLUMN ora;
ALTER TABLE program_items CHANGE COLUMN ora_time ora TIME NULL;
