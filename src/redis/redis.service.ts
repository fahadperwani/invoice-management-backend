// src/redis/redis.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Store access token
  async setAccessToken(
    userId: string,
    token: string,
    ttl?: number,
  ): Promise<void> {
    const key = `access_token:${userId}`;
    await this.cacheManager.set(key, token, ttl || 3600000); // 1 hour default
  }

  // Get access token
  async getAccessToken(userId: string): Promise<string | null> {
    const key = `access_token:${userId}`;
    return await this.cacheManager.get<string>(key);
  }

  // Store refresh token
  async setRefreshToken(
    userId: string,
    token: string,
    ttl?: number,
  ): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.cacheManager.set(key, token, ttl || 604800000); // 7 days default
  }

  // Get refresh token
  async getRefreshToken(userId: string): Promise<string | null> {
    const key = `refresh_token:${userId}`;
    return await this.cacheManager.get<string>(key);
  }

  // Delete token (for logout)
  async deleteToken(
    userId: string,
    type: 'access' | 'refresh' | 'both' = 'both',
  ): Promise<void> {
    if (type === 'access' || type === 'both') {
      await this.cacheManager.del(`access_token:${userId}`);
    }
    if (type === 'refresh' || type === 'both') {
      await this.cacheManager.del(`refresh_token:${userId}`);
    }
  }

  // Check if token exists
  async tokenExists(
    userId: string,
    type: 'access' | 'refresh',
  ): Promise<boolean> {
    const key = `${type}_token:${userId}`;
    const token = await this.cacheManager.get(key);
    return token !== null && token !== undefined;
  }

  // Store blacklisted token (for logout/revocation)
  async blacklistToken(token: string, ttl?: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.cacheManager.set(key, 'revoked', ttl || 3600000);
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.cacheManager.get(key);
    return result !== null && result !== undefined;
  }

  // Generic set method
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  // Generic get method
  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  // Generic delete method
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Clear all cache
  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }
}
