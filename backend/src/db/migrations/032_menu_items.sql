CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titlu VARCHAR(255) NOT NULL,
  descriere TEXT,
  categorie ENUM('aperitiv', 'fel_principal', 'fel_secundar', 'desert') NOT NULL DEFAULT 'aperitiv',
  ordine INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
