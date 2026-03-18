ALTER TABLE services ADD COLUMN type ENUM('supplier', 'expense') NOT NULL DEFAULT 'supplier';
