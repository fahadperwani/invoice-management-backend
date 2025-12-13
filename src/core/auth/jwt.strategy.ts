import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Used to load JWT secret

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from 'Authorization: Bearer <token>'
      ignoreExpiration: false,
      // CRITICAL: Get the secret key from environment variables (e.g., in a ConfigService)
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // This method is called after token validation (signature and expiration)
  // The payload contains the decoded JWT data
  async validate(payload: any) {
    // The request object will now contain the user object: req.user
    // We attach the critical identity and tenant scope data here.
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.orgId, // The essential tenant context
      role: payload.role,
    };
  }
}
