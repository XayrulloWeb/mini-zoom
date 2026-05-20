import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  LIVEKIT_API_KEY?: string;

  @IsString()
  @IsOptional()
  LIVEKIT_API_SECRET?: string;

  @IsString()
  @IsOptional()
  LIVEKIT_URL?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  PORT?: string;

  @IsString()
  @IsOptional()
  LIVEKIT_WEBHOOK_SKIP_AUTH?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.map((err) => {
      const constraints = Object.values(err.constraints || {}).join(', ');
      return `  - ${err.property}: ${constraints}`;
    });
    throw new Error(
      `\n❌ Environment validation failed:\n${messages.join('\n')}\n\nCheck your .env file against .env.example\n`,
    );
  }

  return validatedConfig;
}
