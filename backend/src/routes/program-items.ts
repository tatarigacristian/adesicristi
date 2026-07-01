import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ProgramItemBody {
  titlu: string;
  ora: string;
  descriere?: string | null;
  iconita?: string;
  ordine?: number;
}

export async function programItemRoutes(fastify: FastifyInstance) {
  // Admin list
  fastify.get('/api/admin/program-items', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      // Cronologic, cu momentele de după miezul nopții (< 06:00) la final.
      "SELECT * FROM program_items ORDER BY (ora < '06:00:00'), ora ASC, id ASC"
    );
    return rows;
  });

  // Public list (for /program page)
  fastify.get('/api/program-items', async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      // Cronologic, cu momentele de după miezul nopții (< 06:00) la final.
      "SELECT * FROM program_items ORDER BY (ora < '06:00:00'), ora ASC, id ASC"
    );
    return rows;
  });

  // Create
  fastify.post<{ Body: ProgramItemBody }>('/api/admin/program-items', { preHandler: authenticate }, async (request, reply) => {
    const { titlu, ora, descriere, iconita, ordine } = request.body;
    if (!titlu || !ora) {
      return reply.status(400).send({ error: 'Titlu si ora sunt obligatorii' });
    }
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO program_items (titlu, ora, descriere, iconita, ordine) VALUES (?, ?, ?, ?, ?)',
      [titlu, ora, descriere || null, iconita || 'star', ordine ?? 0]
    );
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM program_items WHERE id = ?', [result.insertId]
    );
    return reply.code(201).send(rows[0]);
  });

  // Update
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramItemBody> }>('/api/admin/program-items/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const pool = getPool();

    const fields = ['titlu', 'ora', 'descriere', 'iconita', 'ordine'] as const;
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    for (const field of fields) {
      if (field in body) {
        updateFields.push(`${field} = ?`);
        updateValues.push(body[field as keyof typeof body]);
      }
    }

    if (updateFields.length === 0) {
      return reply.status(400).send({ error: 'Nimic de actualizat' });
    }

    updateValues.push(id);
    await pool.query(
      `UPDATE program_items SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM program_items WHERE id = ?', [id]
    );
    return rows[0] || reply.status(404).send({ error: 'Not found' });
  });

  // Delete
  fastify.delete<{ Params: { id: string } }>('/api/admin/program-items/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const pool = getPool();
    await pool.query('DELETE FROM program_items WHERE id = ?', [id]);
    return { success: true };
  });
}
