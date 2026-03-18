-- Add 'din_partea' (from whose side) and 'loc_pe_scaun' (seat at table) columns
ALTER TABLE guests ADD COLUMN din_partea ENUM('mire', 'mireasa', 'nasi', 'parintii_mire', 'parintii_mireasa') NULL DEFAULT NULL;
ALTER TABLE guests ADD COLUMN loc_pe_scaun BOOLEAN NOT NULL DEFAULT TRUE;
