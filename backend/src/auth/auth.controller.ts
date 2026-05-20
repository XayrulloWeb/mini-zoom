import { Body, Controller, Delete, Get, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, RefreshDto, UpdateProfileDto } from './dto/index.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
      name: body.name,
    });
  }

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Body() body: UpdateProfileDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.authService.updateProfile(userId, {
      name: body.name,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@Body() body: { password: string }, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.authService.deleteAccount(userId, body.password || '');
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub?.trim();
    if (!userId) throw new UnauthorizedException('Authenticated user is required');
    return userId;
  }
}
