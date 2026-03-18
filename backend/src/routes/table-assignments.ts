import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function tableAssignmentRoutes(fastify: FastifyInstance) {
  // List all assignments (guests + services)
  fastify.get('/api/admin/table-assignments', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [guestRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ta.id, ta.guest_id, ta.service_id, ta.table_number, g.nume, g.prenume, g.plus_one, g.partner_id
       FROM table_assignments ta
       JOIN guests g ON g.id = ta.guest_id
       WHERE ta.guest_id IS NOT NULL
       ORDER BY ta.table_number, g.prenume`
    );
    const [serviceRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ta.id, ta.guest_id, ta.service_id, ta.table_number, s.nume, s.numar_persoane
       FROM table_assignments ta
       JOIN services s ON s.id = ta.service_id
       WHERE ta.service_id IS NOT NULL
       ORDER BY ta.table_number, s.nume`
    );
    return { guests: guestRows, services: serviceRows };
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

  // Assign service to table
  fastify.put<{ Params: { serviceId: string }; Body: { table_number: number } }>(
    '/api/admin/table-assignments/service/:serviceId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { serviceId } = request.params;
      const { table_number } = request.body;
      if (!table_number || table_number < 1) {
        return reply.status(400).send({ error: 'Numar masa invalid' });
      }
      const pool = getPool();
      await pool.execute<ResultSetHeader>(
        `INSERT INTO table_assignments (service_id, table_number) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE table_number = VALUES(table_number)`,
        [serviceId, table_number]
      );
      return { success: true };
    }
  );

  // Unassign service
  fastify.delete<{ Params: { serviceId: string } }>(
    '/api/admin/table-assignments/service/:serviceId',
    { preHandler: authenticate },
    async (request) => {
      const { serviceId } = request.params;
      const pool = getPool();
      await pool.execute('DELETE FROM table_assignments WHERE service_id = ?', [serviceId]);
      return { success: true };
    }
  );
}
