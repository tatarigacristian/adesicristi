import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/index.js';
import { authRoutes } from './routes/auth.js';
import { rsvpRoutes } from './routes/rsvp.js';
import { guestRoutes } from './routes/guests.js';

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  await fastify.register(authRoutes);
  await fastify.register(rsvpRoutes);
  await fastify.register(guestRoutes);

  fastify.get('/api/health', async () => {
    return { status: 'ok' };
  });

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
