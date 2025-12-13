import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 'jwt' must match the name used in PassportStrategy (default is 'jwt')
export class JwtAuthGuard extends AuthGuard('jwt') {}
