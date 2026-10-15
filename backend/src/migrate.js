// Run with: npm run migrate
import { readFileSync } from 'node:fs';
import { pool } from './db.js';

const sql = readFileSync(new URL('../sql/schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Database schema is up to date.');
await pool.end();
