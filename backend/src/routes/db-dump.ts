import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket } from 'mysql2';

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  // Buffer / binary
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  const str = String(val);
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

export async function dbDumpRoutes(fastify: FastifyInstance) {
  fastify.get('/api/admin/db-dump', { preHandler: authenticate }, async (_request, reply) => {
    const pool = getPool();

    // Get all table names except _migrations
    const [tables] = await pool.query<RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME != '_migrations'
       ORDER BY TABLE_NAME`
    );

    const lines: string[] = [];
    lines.push(`-- Database dump: ${new Date().toISOString()}`);
    lines.push(`SET FOREIGN_KEY_CHECKS = 0;\n`);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${tableName}\``);

      if (rows.length === 0) continue;

      lines.push(`-- Table: ${tableName}`);
      lines.push(`TRUNCATE TABLE \`${tableName}\`;`);

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((col) => escapeValue(row[col]));
        lines.push(
          `INSERT INTO \`${tableName}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});`
        );
      }

      lines.push('');
    }

    lines.push('SET FOREIGN_KEY_CHECKS = 1;');

    reply
      .header('Content-Type', 'application/sql')
      .header('Content-Disposition', `attachment; filename="adesicristi_dump_${new Date().toISOString().slice(0, 10)}.sql"`)
      .send(lines.join('\n'));
  });

  fastify.post('/api/admin/db-import', { preHandler: authenticate }, async (request, reply) => {
    const { sql } = request.body as { sql: string };
    if (!sql || typeof sql !== 'string') {
      return reply.code(400).send({ error: 'SQL content is required' });
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    // Split SQL into individual statements (skip comments and empty lines)
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    try {
      for (const stmt of statements) {
        // Skip if it's just a comment after trimming
        const clean = stmt.replace(/--.*$/gm, '').trim();
        if (!clean) continue;
        await conn.query(clean);
        executed++;
      }
      return { success: true, statements: executed };
    } catch (err) {
      const e = err as Error;
      return reply.code(400).send({ error: e.message });
    } finally {
      conn.release();
    }
  });
}
