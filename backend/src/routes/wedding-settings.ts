import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket } from 'mysql2';

export async function weddingSettingsRoutes(fastify: FastifyInstance) {
  // Public: get settings (for frontend)
  fastify.get('/api/wedding-settings', async (_request, reply) => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM wedding_settings LIMIT 1'
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Settings not found' });
    }
    return rows[0];
  });

  // Admin: update settings
  fastify.put('/api/admin/wedding-settings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const pool = getPool();
    const body = request.body as Record<string, unknown>;

    const fields = [
      'nume_mire', 'nume_mireasa',
      'nas_nume', 'nas_prenume', 'nasa_nume', 'nasa_prenume',
      'ceremonie_data', 'ceremonie_ora', 'ceremonie_adresa', 'ceremonie_google_maps', 'ceremonie_descriere',
      'transport_data', 'transport_ora', 'transport_adresa', 'transport_google_maps', 'transport_descriere',
      'petrecere_data', 'petrecere_ora', 'petrecere_adresa', 'petrecere_google_maps', 'petrecere_descriere',
      'link_youtube_video',
      'parinti_mireasa', 'parinti_mire',
      'tata_mireasa_nume', 'tata_mireasa_prenume', 'mama_mireasa_nume', 'mama_mireasa_prenume',
      'tata_mire_nume', 'tata_mire_prenume', 'mama_mire_nume', 'mama_mire_prenume',
      'telefon_mireasa', 'telefon_mire',
      'confirmare_pana_la', 'contact_info',
      'color_main', 'color_second', 'color_button', 'color_text',
      'numar_mese', 'min_persoane_masa', 'max_persoane_masa',
      'numar_estimativ_invitati', 'numar_estimativ_staff',
      'curs_euro',
      'nr_minim_meniuri', 'procent_pret_meniu',
    ];

    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    for (const field of fields) {
      if (field in body) {
        setClauses.push(`${field} = ?`);
        const val = body[field];
        values.push(val === '' ? null : val as string | number | null);
      }
    }

    if (setClauses.length === 0) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    // Ensure a row exists
    const [existing] = await pool.execute<RowDataPacket[]>('SELECT id FROM wedding_settings LIMIT 1');
    if (existing.length === 0) {
      // Create default row first
      await pool.execute('INSERT INTO wedding_settings (nume_mire, nume_mireasa) VALUES ("", "")');
    }

    const sql = `UPDATE wedding_settings SET ${setClauses.join(', ')} WHERE id = (SELECT id FROM (SELECT id FROM wedding_settings LIMIT 1) AS t)`;
    await pool.execute(sql, values);

    // Return updated settings
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM wedding_settings LIMIT 1');
    return rows[0];
  });
}
