import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    // Calcular valores primero (super() debe ser la primera llamada)
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Si no hay credenciales, usar valores dummy para evitar error de inicialización
    // La estrategia no funcionará pero no bloqueará el arranque del servicio
    const finalClientID = clientID || 'dummy-client-id';
    const finalClientSecret = clientSecret || 'dummy-client-secret';
    const finalCallbackURL = callbackURL || 'http://localhost:3000/auth/google/callback';

    // Llamar a super() una sola vez (requerido por TypeScript)
    super({
      clientID: finalClientID,
      clientSecret: finalClientSecret,
      callbackURL: finalCallbackURL,
      scope: ['profile', 'email'],
    });

    // Log después de super()
    if (!clientID || !clientSecret) {
      this.logger.warn('Google OAuth credentials not configured. GoogleStrategy will not work.');
      this.logger.warn('To enable Google OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    } else {
      this.logger.log('Google OAuth strategy initialized successfully');
    }
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Return user profile for AuthService to handle
    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      fullName: profile.displayName,
    };
  }
}

