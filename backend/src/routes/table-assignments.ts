import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function tableAssignmentRoutes(fastify: FastifyInstance) {
  // List all assignments with guest info
  fastify.get('/api/admin/table-assignments', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ta.id, ta.guest_id, ta.table_number, g.nume, g.prenume, g.plus_one, g.partner_id
       FROM table_assignments ta
       JOIN guests g ON g.id = ta.guest_id
       ORDER BY ta.table_number, g.prenume`
    );
    return rows;
  });

  // Assign or move a guest to a table
  fastify.put<{ Params: { guestId: string }; Body: { table_number: number } }>(
    '/api/admin/table-assignments/:guestId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { guestId } = request.params;
      const { table_number } = request.body;

      if (!table_number || table_number < 1) {
        return reply.status(400).send({ error: 'Numar masa invalid' });
      }

      const pool = getPool();
      await pool.execute<ResultSetHeader>(
        `INSERT INTO table_assignments (guest_id, table_number) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE table_number = VALUES(table_number)`,
        [guestId, table_number]
      );

      return { success: true };
    }
  );

  // Unassign a guest
  fastify.delete<{ Params: { guestId: string } }>(
    '/api/admin/table-assignments/:guestId',
    { preHandler: authenticate },
    async (request) => {
      const { guestId } = request.params;
      const pool = getPool();
      await pool.execute('DELETE FROM table_assignments WHERE guest_id = ?', [guestId]);
      return { success: true };
    }
  );
}
