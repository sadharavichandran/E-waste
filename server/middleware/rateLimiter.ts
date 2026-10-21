import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
  keyPrefix?: string;
  errorMessage?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxAttempts = 5,
    keyPrefix = 'rl',
    errorMessage = 'Too many registration or verification attempts. Please wait before trying again.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const emailKey = req.body?.email ? `:${req.body.email.trim().toLowerCase()}` : '';
    const key = `${keyPrefix}:${ip}${emailKey}`;

    const now = Date.now();
    const existing = memoryStore.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (existing.count >= maxAttempts) {
      res.setHeader('Retry-After', Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        code: 'over_email_send_rate_limit',
        error: errorMessage,
        message: errorMessage,
      });
    }

    existing.count += 1;
    return next();
  };
};

// Rate limiter for registration & password reset
export const authRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxAttempts: 5,
  keyPrefix: 'auth_reg',
  errorMessage: 'Too many registration or verification attempts. Please wait before trying again.',
});

// Rate limiter for login
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 8,
  keyPrefix: 'auth_login',
  errorMessage: 'Too many login attempts. Please wait before trying again.',
});
