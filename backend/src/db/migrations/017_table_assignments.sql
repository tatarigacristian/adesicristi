CREATE TABLE IF NOT EXISTS table_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_id INT NOT NULL,
  table_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_guest (guest_id),
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);
