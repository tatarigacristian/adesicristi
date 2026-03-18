import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function invitationLogRoutes(fastify: FastifyInstance) {
  // Log invitation open (public — called when guest opens their invitation)
  fastify.post('/api/invitation-log/:slug', async (request, reply) => {
    const pool = getPool();
    const { slug } = request.params as { slug: string };

    const [guests] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM guests WHERE slug = ?',
      [slug]
    );

    if (!guests[0]) {
      return reply.code(404).send({ error: 'Guest not found' });
    }

    const guestId = guests[0].id;
    const userAgent = (request.headers['user-agent'] || '').substring(0, 200);

    let device = 'Desktop';
    if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet';
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      device = 'Mobile';
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO invitation_logs (guest_id, open_count, last_open_at, device, browser)
       VALUES (?, 1, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE open_count = open_count + 1, last_open_at = NOW(), device = VALUES(device), browser = VALUES(browser)`,
      [guestId, device, userAgent]
    );

    return { success: true };
  });

  // Get all invitation logs (admin)
  fastify.get('/api/admin/invitation-logs', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT il.*, g.nume, g.prenume, g.slug, g.plus_one, g.partner_id
       FROM invitation_logs il
       JOIN guests g ON g.id = il.guest_id
       ORDER BY il.last_open_at DESC`
    );
    return rows;
  });

  // Delete invitation log for a guest (admin)
  fastify.delete('/api/admin/invitation-logs/:guestId', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const { guestId } = request.params as { guestId: string };

    await pool.query<ResultSetHeader>(
      'DELETE FROM invitation_logs WHERE guest_id = ?',
      [guestId]
    );

    return { success: true };
  });
}
