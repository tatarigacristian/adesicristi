-- Add parent names, RSVP deadline, and contact info for classic invitation
ALTER TABLE wedding_settings ADD COLUMN parinti_mireasa VARCHAR(300) NULL;
ALTER TABLE wedding_settings ADD COLUMN parinti_mire VARCHAR(300) NULL;
ALTER TABLE wedding_settings ADD COLUMN confirmare_pana_la DATE NULL;
ALTER TABLE wedding_settings ADD COLUMN contact_info TEXT NULL;
