-- Add is_restaurant flag to services (only one service should have this true)
ALTER TABLE services ADD COLUMN is_restaurant BOOLEAN NOT NULL DEFAULT FALSE;
