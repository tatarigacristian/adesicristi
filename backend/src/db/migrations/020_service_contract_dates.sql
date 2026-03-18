ALTER TABLE services ADD COLUMN contract_start DATETIME NULL;
ALTER TABLE services ADD COLUMN contract_end DATETIME NULL;
ALTER TABLE services DROP COLUMN perioada_contract;
