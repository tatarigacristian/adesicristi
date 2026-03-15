import { getPool } from './connection.js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const pool = getPool();

  // Ensure migrations tracking table exists
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already executed migrations
  const [executed] = await pool.execute('SELECT name FROM _migrations ORDER BY name') as any[];
  const executedNames = new Set(executed.map((r: any) => r.name));

  // Read migration files
  const migrationsDir = join(__dirname, 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executedNames.has(file)) continue;

    console.log(`Running migration: ${file}`);
    const sql = await readFile(join(migrationsDir, file), 'utf-8');

    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await pool.execute(statement);
    }

    await pool.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
    console.log(`Migration complete: ${file}`);
  }
}
