-- Ensure 008 columns exist (may have been skipped due to comment-parsing bug)
ALTER TABLE wedding_settings ADD COLUMN parinti_mireasa VARCHAR(300) NULL;
ALTER TABLE wedding_settings ADD COLUMN parinti_mire VARCHAR(300) NULL;
ALTER TABLE wedding_settings ADD COLUMN confirmare_pana_la DATE NULL;
ALTER TABLE wedding_settings ADD COLUMN contact_info TEXT NULL;

-- Structured parent names (bride and groom sides)
ALTER TABLE wedding_settings ADD COLUMN tata_mireasa_nume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN tata_mireasa_prenume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN mama_mireasa_nume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN mama_mireasa_prenume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN tata_mire_nume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN tata_mire_prenume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN mama_mire_nume VARCHAR(200) NULL;
ALTER TABLE wedding_settings ADD COLUMN mama_mire_prenume VARCHAR(200) NULL;
