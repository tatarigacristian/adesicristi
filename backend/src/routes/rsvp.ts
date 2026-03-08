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
}

export async function rsvpRoutes(fastify: FastifyInstance) {
  // Public: submit RSVP
  fastify.post<{ Body: RsvpBody }>('/api/rsvp', async (request, reply) => {
    const { person_count, name, partner_name, message, attending } = request.body;

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
      'INSERT INTO rsvp_responses (person_count, name, partner_name, message, attending) VALUES (?, ?, ?, ?, ?)',
      [person_count, name, partner_name || null, message || null, attending]
    );

    return reply.status(201).send({
      id: result.insertId,
      message: 'RSVP saved successfully',
    });
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
