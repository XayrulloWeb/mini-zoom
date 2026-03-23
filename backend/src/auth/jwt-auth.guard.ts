import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

export type JwtUserPayload = {
  sub: string;
  email: string;
  name?: string | null;
  role?: UserRole;
  iat?: number;
  exp?: number;
};

type AuthenticatedRequest = Request & {
  user?: JwtUserPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must be in Bearer format');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(token, {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret',
      });
      if (!payload.role) {
        payload.role = UserRole.HOST;
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
