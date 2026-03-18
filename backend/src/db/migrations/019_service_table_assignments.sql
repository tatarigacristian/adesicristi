ALTER TABLE table_assignments ADD COLUMN service_id INT NULL;
ALTER TABLE table_assignments DROP FOREIGN KEY table_assignments_ibfk_1;
ALTER TABLE table_assignments DROP INDEX unique_guest;
ALTER TABLE table_assignments MODIFY guest_id INT NULL;
ALTER TABLE table_assignments ADD UNIQUE KEY unique_guest (guest_id);
ALTER TABLE table_assignments ADD CONSTRAINT fk_ta_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;
ALTER TABLE table_assignments ADD UNIQUE KEY unique_service (service_id);
ALTER TABLE table_assignments ADD CONSTRAINT fk_ta_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
