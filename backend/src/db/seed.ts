import bcrypt from 'bcrypt';
import { getPool } from './connection.js';

async function seed() {
  const pool = getPool();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await pool.execute(
    'INSERT IGNORE INTO admin_users (username, password) VALUES (?, ?)',
    ['admin', hashedPassword]
  );

  console.log('Seed completed: admin user created (username: admin)');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
