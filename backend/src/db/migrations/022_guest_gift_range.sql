ALTER TABLE guests ADD COLUMN estimated_gift_min INT DEFAULT NULL;
ALTER TABLE guests ADD COLUMN estimated_gift_max INT DEFAULT NULL;
-- Copy existing values to both min and max
UPDATE guests SET estimated_gift_min = estimated_gift, estimated_gift_max = estimated_gift WHERE estimated_gift IS NOT NULL;
ALTER TABLE guests DROP COLUMN estimated_gift;
