import { getPool } from './connection.js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Statements that don't work with the connection pool (already connected to DB)
const SKIP_PATTERNS = [
  /^CREATE\s+DATABASE/i,
  /^USE\s+/i,
  /^DROP\s+DATABASE/i,
];

export async function runMigrations() {
  const pool = getPool();

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already executed migrations
  const [executed] = await pool.query('SELECT name FROM _migrations ORDER BY name') as any[];
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
      // Skip statements that aren't compatible with pool connection
      if (SKIP_PATTERNS.some((p) => p.test(statement))) {
        console.log(`  Skipping: ${statement.substring(0, 50)}...`);
        continue;
      }
      try {
        await pool.query(statement);
      } catch (err: any) {
        // Ignore "already exists" errors for idempotent migrations
        const ignorable = [
          1060, // Duplicate column name
          1061, // Duplicate key name
          1050, // Table already exists
          1062, // Duplicate entry (for unique constraints)
          1826, // Duplicate foreign key constraint name
          1054, // Unknown column (e.g. AFTER ref to missing column, or UPDATE on dropped column)
          1091, // Can't DROP column; check that it exists
        ];
        if (ignorable.includes(err.errno)) {
          console.log(`  Ignored (already applied): ${err.sqlMessage}`);
        } else {
          throw err;
        }
      }
    }

    await pool.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
    console.log(`Migration complete: ${file}`);
  }
}
