ALTER TABLE services ADD COLUMN has_pret_per_invitat BOOLEAN NOT NULL DEFAULT FALSE;
-- Set flag for existing services that have pret_per_invitat
UPDATE services SET has_pret_per_invitat = TRUE WHERE pret_per_invitat IS NOT NULL;
