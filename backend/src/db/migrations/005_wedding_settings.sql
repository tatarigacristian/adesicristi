USE adesicristi;

CREATE TABLE IF NOT EXISTS wedding_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Couple
  nume_mire VARCHAR(200) NOT NULL DEFAULT '',
  nume_mireasa VARCHAR(200) NOT NULL DEFAULT '',

  -- Cununie Religioasa
  ceremonie_data DATE NULL,
  ceremonie_ora VARCHAR(10) NULL,
  ceremonie_adresa TEXT NULL,
  ceremonie_google_maps VARCHAR(500) NULL,
  ceremonie_descriere TEXT NULL,

  -- Transport
  transport_data DATE NULL,
  transport_ora VARCHAR(10) NULL,
  transport_adresa TEXT NULL,
  transport_google_maps VARCHAR(500) NULL,
  transport_descriere TEXT NULL,

  -- Petrecere
  petrecere_data DATE NULL,
  petrecere_ora VARCHAR(10) NULL,
  petrecere_adresa TEXT NULL,
  petrecere_google_maps VARCHAR(500) NULL,
  petrecere_descriere TEXT NULL,

  -- YouTube
  link_youtube_video VARCHAR(500) NULL,

  -- Theme colors
  color_main VARCHAR(7) NOT NULL DEFAULT '#FDF8F7',
  color_second VARCHAR(7) NOT NULL DEFAULT '#C4A484',
  color_button VARCHAR(7) NOT NULL DEFAULT '#C4A484',
  color_text VARCHAR(7) NOT NULL DEFAULT '#3A3A3A',

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings row
INSERT INTO wedding_settings (
  nume_mire, nume_mireasa,
  ceremonie_data, ceremonie_ora, ceremonie_adresa, ceremonie_google_maps, ceremonie_descriere,
  transport_data, transport_ora, transport_adresa, transport_google_maps, transport_descriere,
  petrecere_data, petrecere_ora, petrecere_adresa, petrecere_google_maps, petrecere_descriere,
  link_youtube_video
) VALUES (
  'Cristi', 'Ade',
  '2026-07-04', '15:00', 'Adresa va fi comunicata ulterior', 'https://maps.app.goo.gl/BpJMVU3vwg3QuLDr5', 'Cununia Religioasa',
  '2026-07-04', '18:00', 'Adresa va fi comunicata ulterior', 'https://maps.app.goo.gl/zvSki9tUL6UGbsyU9', 'Transport',
  '2026-07-04', '19:00', 'Adresa va fi comunicata ulterior', 'https://maps.app.goo.gl/kpEz9hCmH5mY19s68', 'Petrecerea',
  'https://www.youtube.com/embed/jEj57Rqeuy8'
);
