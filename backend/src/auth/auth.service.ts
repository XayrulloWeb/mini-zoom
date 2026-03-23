import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const email = this.normalizeEmail(input.email);
    const password = input.password?.trim();
    const name = input.name?.trim() || null;

    this.validateCredentials(email, password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      user,
      accessToken: this.signAccessToken(user.id, user.email, user.name, user.role),
    };
  }

  async login(input: LoginInput) {
    const email = this.normalizeEmail(input.email);
    const password = input.password?.trim();
    this.validateCredentials(email, password);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: this.signAccessToken(user.id, user.email, user.name, user.role),
    };
  }

  private signAccessToken(
    userId: string,
    email: string,
    name: string | null,
    role: UserRole,
  ) {
    return this.jwtService.sign({
      sub: userId,
      email,
      name,
      role,
    });
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private validateCredentials(email: string, password: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }
}
