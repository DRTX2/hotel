/**
 * Acceso centralizado y validado a variables de entorno.
 * Fail-fast: en producción las variables sensibles son obligatorias.
 * En desarrollo/test se usan defaults seguros solo para entorno local.
 */

function str(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Env var ${name} must be a number, got: ${raw}`);
  }
  return parsed;
}

const isProduction = process.env.NODE_ENV === 'production';

function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`Missing required env var in production: ${name}`);
  }
  return devFallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  port: num('PORT', 3000),
  corsOrigins: str('CORS_ORIGIN', 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: num('RATE_LIMIT_MAX', 100),
  },
  redisUrl: process.env.REDIS_URL || undefined,
  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessTtl: str('JWT_ACCESS_TTL', '15m'),
    refreshTtl: str('JWT_REFRESH_TTL', '7d'),
  },
  bcryptRounds: num('BCRYPT_ROUNDS', isProduction ? 12 : 10),
  admin: {
    email: str('ADMIN_EMAIL', 'admin@hotel.local'),
    password: secret('ADMIN_PASSWORD', 'Admin123!'),
  },
};
