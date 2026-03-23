import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('register')
  async register(@Body() body: RegisterBody) {
    return this.authService.register({
      email: body.email || '',
      password: body.password || '',
      name: body.name,
    });
  }

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginBody) {
    return this.authService.login({
      email: body.email || '',
      password: body.password || '',
    });
  }
}
