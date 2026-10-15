import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { HttpError, safeEqual } from '../utils.js';

export const signToken = (userId) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });

// Public API: needs `Authorization: Bearer <token>`. Sets req.user = { id, name, email }
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
  if (!rows[0]) throw new HttpError(401, 'Your session is no longer valid. Please log in again.');
  req.user = rows[0];
  next();
}

// Internal API: only the AI service may call it
export function requireInternalKey(req, _res, next) {
  if (!safeEqual(req.headers['x-internal-key'] || '', config.internalKey)) {
    throw new HttpError(401, 'Invalid internal key.');
  }
  next();
}
