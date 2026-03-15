import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { getPool } from '../db/connection.js';
import { RowDataPacket } from 'mysql2';

interface LoginBody {
  username: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginBody }>('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, password FROM admin_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({ id: user.id, username: user.username });
    return { token };
  });
}
