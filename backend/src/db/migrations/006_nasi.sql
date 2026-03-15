USE adesicristi;

ALTER TABLE wedding_settings
  ADD COLUMN nas_nume VARCHAR(200) NULL AFTER nume_mireasa,
  ADD COLUMN nas_prenume VARCHAR(200) NULL AFTER nas_nume,
  ADD COLUMN nasa_nume VARCHAR(200) NULL AFTER nas_prenume,
  ADD COLUMN nasa_prenume VARCHAR(200) NULL AFTER nasa_nume;
