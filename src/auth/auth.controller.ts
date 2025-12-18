import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from 'src/core/types/core.types';
import { JwtAuthGuard } from 'src/core/auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register-tenant')
  @HttpCode(HttpStatus.CREATED)
  async registerTenant(@Body() dto: RegisterTenantDto): Promise<any> {
    return this.authService.registerTenant(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<any> {
    // Implement login logic here
    return this.authService.login(dto);
  }

  @ApiBearerAuth('access-token')
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refreshTokens(
    @Req() req: AuthenticatedRequest,
    @Body('refreshToken') refreshToken: string,
  ): Promise<any> {
    const { sub } = req.payload;

    return this.authService.refreshTokens(sub, refreshToken);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest): Promise<any> {
    const token: string = req.token;
    const { sub: user } = req.payload;

    if (!token || !user) {
      throw new Error('Invalid token or user');
    }

    return this.authService.logout(token, user);
  }
}
