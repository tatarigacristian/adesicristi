import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/index.js';
import { authRoutes } from './routes/auth.js';
import { rsvpRoutes } from './routes/rsvp.js';
import { guestRoutes } from './routes/guests.js';
import { weddingSettingsRoutes } from './routes/wedding-settings.js';
import { tableAssignmentRoutes } from './routes/table-assignments.js';
import { serviceRoutes } from './routes/services.js';
import { invitationLogRoutes } from './routes/invitation-logs.js';
import { barItemRoutes } from './routes/bar-items.js';
import { menuItemRoutes } from './routes/menu-items.js';
import { dbDumpRoutes } from './routes/db-dump.js';
import { runMigrations } from './db/migrate.js';

const fastify = Fastify({ logger: true });

async function start() {
  // Run pending migrations before starting
  await runMigrations();
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  await fastify.register(cors, {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  await fastify.register(authRoutes);
  await fastify.register(rsvpRoutes);
  await fastify.register(guestRoutes);
  await fastify.register(weddingSettingsRoutes);
  await fastify.register(tableAssignmentRoutes);
  await fastify.register(serviceRoutes);
  await fastify.register(invitationLogRoutes);
  await fastify.register(barItemRoutes);
  await fastify.register(menuItemRoutes);
  await fastify.register(dbDumpRoutes);

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
