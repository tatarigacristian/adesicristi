CREATE TABLE IF NOT EXISTS invitation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_id INT NOT NULL,
  open_count INT NOT NULL DEFAULT 0,
  last_open_at DATETIME NULL,
  device VARCHAR(200) NULL,
  browser VARCHAR(200) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_guest_log (guest_id),
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);
