// redis.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisService } from './redis.service';
import { JwtStrategy } from 'src/core/auth/jwt.strategy';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD,
          ttl: 3600000, // default TTL in milliseconds (1 hour)
        }),
      }),
    }),
  ],
  providers: [RedisService, JwtStrategy],
  exports: [RedisService],
})
export class RedisModule {}
