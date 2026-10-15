import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { signToken } from '../middleware/auth.js';
import { loginSchema, signupSchema } from '../validators/schemas.js';
import { HttpError } from '../utils.js';

const router = Router();

router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many attempts. Please wait a few minutes.' }),
}));

const session = (u) => ({ token: signToken(u.id), user: { id: u.id, name: u.name, email: u.email } });

router.post('/signup', async (req, res) => {
  const { name, email, password } = signupSchema.parse(req.body);
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash],
    );
    res.status(201).json(session(rows[0]));
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists.');
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { rows } = await query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Invalid email or password.');
  res.json(session(user));
});

export default router;
