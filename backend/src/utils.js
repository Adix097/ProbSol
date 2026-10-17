import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const normalizeTopic = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ');

export const normalizeLearnerProfile = (profile = {}) => ({
  experience: profile.experience || 'unknown',
  weekly_hours: Number(profile.weekly_hours) || 0,
  target: String(profile.target || '').trim().replace(/\s+/g, ' ').slice(0, 160),
});

export const learnerProfileKey = (profile) => JSON.stringify(normalizeLearnerProfile(profile));

export const newRoadmapId = () => `rm_${crypto.randomBytes(5).toString('hex')}`;

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
