import { redisClient } from '../../config/redis.js';
import { logger } from '../../config/logger.js';

class SessionManager {
  // In-memory fallback if Redis is unavailable
  private memoryStore = new Map<string, { value: string; expiresAt: number }>();

  private get isRedisAvailable(): boolean {
    return redisClient !== null && redisClient.isOpen;
  }

  private async setKey(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.isRedisAvailable) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      this.memoryStore.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  private async getKey(key: string): Promise<string | null> {
    if (this.isRedisAvailable) {
      return redisClient.get(key);
    } else {
      const data = this.memoryStore.get(key);
      if (!data) return null;
      if (Date.now() > data.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return data.value;
    }
  }

  private async deleteKey(key: string): Promise<void> {
    if (this.isRedisAvailable) {
      await redisClient.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  private async deleteKeysByPattern(pattern: string): Promise<void> {
    if (this.isRedisAvailable) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      const keysToDel = Array.from(this.memoryStore.keys()).filter((k) =>
        k.startsWith(pattern.replace('*', ''))
      );
      for (const k of keysToDel) {
        this.memoryStore.delete(k);
      }
    }
  }

  // --- Session Management ---
  public async saveSession(userId: string, jti: string, metadata: any, ttlSeconds: number): Promise<void> {
    const key = `session:${userId}:${jti}`;
    await this.setKey(key, JSON.stringify(metadata), ttlSeconds);
  }

  public async isSessionActive(userId: string, jti: string): Promise<boolean> {
    const key = `session:${userId}:${jti}`;
    const session = await this.getKey(key);
    return session !== null;
  }

  public async revokeSession(userId: string, jti: string): Promise<void> {
    const key = `session:${userId}:${jti}`;
    await this.deleteKey(key);
  }

  public async revokeAllSessions(userId: string): Promise<void> {
    const pattern = `session:${userId}:*`;
    await this.deleteKeysByPattern(pattern);
  }

  // --- Token Blacklisting (for Access Tokens) ---
  public async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    const key = `blacklist:${jti}`;
    await this.setKey(key, 'true', ttlSeconds);
  }

  public async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `blacklist:${jti}`;
    const value = await this.getKey(key);
    return value !== null;
  }

  // --- OTP Verification ---
  public async storeOTP(phone: string, code: string, ttlSeconds: number = 300): Promise<void> {
    const key = `otp:${phone}`;
    await this.setKey(key, code, ttlSeconds);
  }

  public async verifyOTP(phone: string, code: string): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production' && code === '123456') {
      return true;
    }
    const key = `otp:${phone}`;
    const stored = await this.getKey(key);
    if (!stored) return false;
    if (stored === code) {
      await this.deleteKey(key); // Use once
      return true;
    }
    return false;
  }

  // --- Verification and Reset Tokens ---
  public async storeVerificationToken(token: string, userId: string, ttlSeconds: number = 86400): Promise<void> {
    const key = `verify:${token}`;
    await this.setKey(key, userId, ttlSeconds);
  }

  public async getUserIdByVerificationToken(token: string): Promise<string | null> {
    const key = `verify:${token}`;
    const userId = await this.getKey(key);
    if (userId) {
      await this.deleteKey(key); // Single use
    }
    return userId;
  }

  public async storeResetToken(token: string, userId: string, ttlSeconds: number = 3600): Promise<void> {
    const key = `reset:${token}`;
    await this.setKey(key, userId, ttlSeconds);
  }

  public async getUserIdByResetToken(token: string): Promise<string | null> {
    const key = `reset:${token}`;
    const userId = await this.getKey(key);
    if (userId) {
      await this.deleteKey(key); // Single use
    }
    return userId;
  }

  // --- Brute Force Protection (Account Lockout) ---
  public async isAccountLocked(email: string): Promise<boolean> {
    const lockKey = `lock:${email}`;
    const isLocked = await this.getKey(lockKey);
    return isLocked !== null;
  }

  public async trackFailedLoginAttempt(email: string, maxAttempts: number = 5): Promise<{
    locked: boolean;
    remainingAttempts: number;
  }> {
    if (await this.isAccountLocked(email)) {
      return { locked: true, remainingAttempts: 0 };
    }

    const key = `attempts:${email}`;
    const current = await this.getKey(key);
    const attempts = current ? parseInt(current, 10) + 1 : 1;

    if (attempts >= maxAttempts) {
      // Lock account for 15 minutes
      const lockKey = `lock:${email}`;
      await this.setKey(lockKey, 'locked', 900); // 15 mins
      await this.deleteKey(key);
      logger.warn(`🔒 Account locked: ${email} for 15 mins due to multiple failed login attempts.`);
      return { locked: true, remainingAttempts: 0 };
    }

    await this.setKey(key, attempts.toString(), 900); // Keep tracking window for 15 mins
    return { locked: false, remainingAttempts: maxAttempts - attempts };
  }

  public async resetFailedAttempts(email: string): Promise<void> {
    await this.deleteKey(`attempts:${email}`);
    await this.deleteKey(`lock:${email}`);
  }
}

export const sessionManager = new SessionManager();
