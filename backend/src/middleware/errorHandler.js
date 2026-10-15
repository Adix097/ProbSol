import { ZodError } from 'zod';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found.' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues[0]?.message || 'Invalid request.' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }
  
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
