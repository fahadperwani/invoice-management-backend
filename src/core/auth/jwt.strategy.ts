import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Used to load JWT secret
import { JwtPayload } from '../types/core.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from 'Authorization: Bearer <token>'
      ignoreExpiration: false,
      // CRITICAL: Get the secret key from environment variables (e.g., in a ConfigService)
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.orgId,
      permissions: payload.permissions,
    };
  }
}
