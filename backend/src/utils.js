import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const normalizeTopic = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ');

export const newRoadmapId = () => `rm_${crypto.randomBytes(5).toString('hex')}`;

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
