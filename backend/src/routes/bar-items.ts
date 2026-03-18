import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface BarItemBody {
  titlu: string;
  descriere?: string;
  categorie: 'alcoolic' | 'non_alcoolic';
  ordine?: number;
}

export async function barItemRoutes(fastify: FastifyInstance) {
  // List all
  fastify.get('/api/admin/bar-items', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM bar_items ORDER BY ordine ASC, id ASC'
    );
    return rows;
  });

  // Public list (for preview pages)
  fastify.get('/api/bar-items', async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM bar_items ORDER BY ordine ASC, id ASC'
    );
    return rows;
  });

  // Create
  fastify.post<{ Body: BarItemBody }>('/api/admin/bar-items', { preHandler: authenticate }, async (request, reply) => {
    const { titlu, descriere, categorie, ordine } = request.body;
    if (!titlu || !categorie) {
      return reply.status(400).send({ error: 'Titlu si categorie sunt obligatorii' });
    }
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO bar_items (titlu, descriere, categorie, ordine) VALUES (?, ?, ?, ?)',
      [titlu, descriere || null, categorie, ordine ?? 0]
    );
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM bar_items WHERE id = ?', [result.insertId]
    );
    return reply.code(201).send(rows[0]);
  });

  // Update
  fastify.put<{ Params: { id: string }; Body: Partial<BarItemBody> }>('/api/admin/bar-items/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    const pool = getPool();

    const fields = ['titlu', 'descriere', 'categorie', 'ordine'] as const;
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
      `UPDATE bar_items SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM bar_items WHERE id = ?', [id]
    );
    return rows[0] || reply.status(404).send({ error: 'Not found' });
  });

  // Delete
  fastify.delete<{ Params: { id: string } }>('/api/admin/bar-items/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const pool = getPool();
    await pool.query('DELETE FROM bar_items WHERE id = ?', [id]);
    return { success: true };
  });
}
