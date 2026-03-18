ALTER TABLE table_assignments ADD COLUMN service_id INT NULL;
ALTER TABLE table_assignments DROP INDEX unique_guest;
ALTER TABLE table_assignments MODIFY guest_id INT NULL;
ALTER TABLE table_assignments ADD UNIQUE KEY unique_guest (guest_id);
ALTER TABLE table_assignments ADD UNIQUE KEY unique_service (service_id);
ALTER TABLE table_assignments ADD CONSTRAINT fk_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
