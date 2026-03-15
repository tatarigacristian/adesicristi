import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'local',
      dateStrings: true,
    });
  }
  return pool;
}
