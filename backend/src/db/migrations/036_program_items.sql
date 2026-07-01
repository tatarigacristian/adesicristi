CREATE TABLE IF NOT EXISTS program_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titlu VARCHAR(255) NOT NULL,
  ora VARCHAR(20) NOT NULL,
  descriere TEXT,
  iconita VARCHAR(50) NOT NULL DEFAULT 'star',
  ordine INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO program_items (titlu, ora, descriere, iconita, ordine) VALUES
('Invitat special Marej', '19:00', NULL, 'microphone', 0),
('Aperitiv', '20:00', NULL, 'champagne', 1),
('Primul dans', '20:30', NULL, 'music', 2),
('Gustare caldă', '22:00', NULL, 'pot', 3),
('Fel principal', '00:00', NULL, 'fork-knife', 4),
('Prezentare tort & artificii', '01:00', NULL, 'cake', 5);
