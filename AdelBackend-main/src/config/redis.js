import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
};

let redis = null;
let redisConnected = false;

try {
  redis = new Redis(redisConfig);

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully.');
    redisConnected = true;
  });

  redis.on('error', (err) => {
    console.warn('⚠️ Redis connection error:', err.message);
    console.warn('⚠️ Continuing without Redis (some features may be limited)');
    redisConnected = false;
  });

  redis.on('close', () => {
    redisConnected = false;
  });
} catch (error) {
  console.warn('⚠️ Failed to initialize Redis:', error.message);
  console.warn('⚠️ Continuing without Redis (some features may be limited)');
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable() {
  return redisConnected && redis;
}

/**
 * Store refresh token hash in Redis
 * @param {string} userId - User ID
 * @param {string} tokenHash - Hashed refresh token
 * @param {number} expiresInSeconds - Expiration time in seconds
 */
export async function storeRefreshToken(userId, tokenHash, expiresInSeconds) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, skipping refresh token storage');
    return;
  }
  try {
    const key = `refresh_token:${userId}:${tokenHash}`;
    await redis.setex(key, expiresInSeconds, 'valid');
  } catch (error) {
    console.warn('⚠️ Failed to store refresh token in Redis:', error.message);
  }
}

/**
 * Check if refresh token is valid
 * @param {string} userId - User ID
 * @param {string} tokenHash - Hashed refresh token
 */
export async function isRefreshTokenValid(userId, tokenHash) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, refresh token validation skipped');
    return false;
  }
  try {
    const key = `refresh_token:${userId}:${tokenHash}`;
    const result = await redis.get(key);
    return result === 'valid';
  } catch (error) {
    console.warn('⚠️ Failed to check refresh token in Redis:', error.message);
    return false;
  }
}

/**
 * Revoke refresh token
 * @param {string} userId - User ID
 * @param {string} tokenHash - Hashed refresh token
 */
export async function revokeRefreshToken(userId, tokenHash) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, skipping refresh token revocation');
    return;
  }
  try {
    const key = `refresh_token:${userId}:${tokenHash}`;
    await redis.del(key);
  } catch (error) {
    console.warn('⚠️ Failed to revoke refresh token in Redis:', error.message);
  }
}

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 */
export async function revokeAllUserTokens(userId) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, skipping token revocation');
    return;
  }
  try {
    const pattern = `refresh_token:${userId}:*`;
    const stream = redis.scanStream({ match: pattern, count: 100 });

    await new Promise((resolve, reject) => {
      stream.on('data', async (resultKeys) => {
        if (resultKeys.length) {
          try {
            await redis.del(...resultKeys);
          } catch (err) {
            console.error('Error deleting keys from Redis:', err);
          }
        }
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  } catch (error) {
    console.warn('⚠️ Failed to revoke user tokens in Redis:', error.message);
  }
} 

/**
 * Add token to blacklist
 * @param {string} token - Token to blacklist
 * @param {number} expiresInSeconds - Time until token naturally expires
 */
export async function blacklistToken(token, expiresInSeconds) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, skipping token blacklisting');
    return;
  }
  try {
    const key = `blacklist:${token}`;
    await redis.setex(key, expiresInSeconds, 'revoked');
  } catch (error) {
    console.warn('⚠️ Failed to blacklist token in Redis:', error.message);
  }
}

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 */
export async function isTokenBlacklisted(token) {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, token blacklist check skipped');
    return false;
  }
  try {
    const key = `blacklist:${token}`;
    const result = await redis.get(key);
    return result === 'revoked';
  } catch (error) {
    console.warn('⚠️ Failed to check token blacklist in Redis:', error.message);
    return false;
  }
}

export default redis;

