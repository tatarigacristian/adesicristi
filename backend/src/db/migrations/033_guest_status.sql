-- Replace boolean loc_pe_scaun with status ENUM field
ALTER TABLE guests ADD COLUMN status ENUM('prezenta_si_dar', 'doar_dar', 'incertitudine') NOT NULL DEFAULT 'prezenta_si_dar';

-- Migrate existing data: loc_pe_scaun=true -> prezenta_si_dar, loc_pe_scaun=false -> doar_dar
UPDATE guests SET status = 'doar_dar' WHERE loc_pe_scaun = FALSE;

-- Drop old column
ALTER TABLE guests DROP COLUMN loc_pe_scaun;
