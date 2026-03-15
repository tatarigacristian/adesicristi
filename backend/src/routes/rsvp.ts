import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface RsvpBody {
  person_count: number;
  name: string;
  partner_name?: string;
  message?: string;
  attending: boolean;
  guest_id?: number;
}

export async function rsvpRoutes(fastify: FastifyInstance) {
  // Public: submit RSVP
  fastify.post<{ Body: RsvpBody }>('/api/rsvp', async (request, reply) => {
    const { person_count, name, partner_name, message, attending, guest_id } = request.body;

    if (!name || !person_count) {
      return reply.status(400).send({ error: 'Name and person count are required' });
    }

    if (person_count === 2 && !partner_name) {
      return reply.status(400).send({ error: 'Partner name is required for 2 persons' });
    }

    if (person_count < 1 || person_count > 2) {
      return reply.status(400).send({ error: 'Person count must be 1 or 2' });
    }

    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO rsvp_responses (person_count, name, partner_name, message, attending, guest_id) VALUES (?, ?, ?, ?, ?, ?)',
      [person_count, name, partner_name || null, message || null, attending, guest_id || null]
    );

    return reply.status(201).send({
      id: result.insertId,
      message: 'RSVP saved successfully',
    });
  });

  // Public: get RSVP status by guest_id
  fastify.get<{ Params: { guestId: string } }>('/api/rsvp/guest/:guestId', async (request, reply) => {
    const { guestId } = request.params;
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM rsvp_responses WHERE guest_id = ? ORDER BY created_at DESC LIMIT 1',
      [guestId]
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'No RSVP found' });
    }
    return rows[0];
  });

  // Public: update RSVP (cancel attendance)
  fastify.put<{ Params: { id: string }; Body: { attending: boolean } }>('/api/rsvp/:id', async (request, reply) => {
    const { id } = request.params;
    const { attending } = request.body;
    const pool = getPool();
    await pool.execute(
      'UPDATE rsvp_responses SET attending = ? WHERE id = ?',
      [attending, id]
    );
    return { success: true };
  });

  // Admin: list all RSVPs
  fastify.get('/api/admin/rsvp', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM rsvp_responses ORDER BY created_at DESC'
    );
    return rows;
  });
}
