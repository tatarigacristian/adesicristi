USE adesicristi;

ALTER TABLE rsvp_responses ADD COLUMN guest_id INT NULL;
ALTER TABLE rsvp_responses ADD CONSTRAINT fk_rsvp_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL;
