import { createRequire } from 'module';

const require = createRequire(import.meta.url);

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  throw new Error('FATAL: DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT must be set in environment');
}

let PoolCtor: any = null;
try {
  const pg = require('pg');
  PoolCtor = pg.Pool ?? pg;
} catch (err) {
  console.error('Unable to load pg client (pg). Postgres features will be unavailable.', err);
  throw err;
}

export const pool = new PoolCtor({
  family: 6,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT as string, 10),
  ssl: {
    rejectUnauthorized: false,
  },
});

// Async connectivity check (non-blocking for module importers)
(async function verify() {
  try {
    const client = await pool.connect();
    client.release();
    console.log(`✅ SUCCESS: Database connection test successful to ${process.env.DB_HOST}`);
  } catch (err) {
    console.error('❌ WARNING: Database connection test failed.', err);
    // do not exit process; let caller handle fatal behavior
  }
})();


