import { Result } from '@aaron/common';
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import { prisma } from '../../config/database';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../mail/email.service';

import { SignupDto, SigninDto } from './dto/auth.dto';



export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    isEmailVerified: boolean;
    roles: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crea un Client en operations-service para usuarios CUSTOMER
   */
  private async createClientInOperations(userId: string, email: string, fullName?: string, lat?: number, lng?: number): Promise<void> {
    const opsUrl = process.env.OPERATIONS_SERVICE_URL || 'http://localhost:3002';
    const internalKey = process.env.INTERNAL_SERVICE_KEY || 'aaron-internal-key';

    try {
      const response = await fetch(`${opsUrl}/clients/internal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify({ userId, email, fullName, lat, lng }),
      });

      const result = await response.json();
      
      if (!result.success) {
        this.logger.warn(`Failed to create client in operations: ${result.error}`);
      } else {
        this.logger.log(`Client created in operations for user ${userId}`);
      }
    } catch (error) {
      // No fallar el signup si operations-service no está disponible
      this.logger.error(`Error creating client in operations: ${error}`);
    }
  }

  async signup(dto: SignupDto, ip?: string, userAgent?: string): Promise<Result<Error, AuthResult>> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    this.logger.log(`[AuthService] Signup started for: ${normalizedEmail}`);
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return Result.error(new Error('User already exists'));
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Buscar o crear el rol CUSTOMER
      let customerRole = await prisma.role.findUnique({
        where: { name: 'CUSTOMER' },
      });

      if (!customerRole) {
        customerRole = await prisma.role.create({
          data: {
            name: 'CUSTOMER',
            description: 'Cliente del servicio Aaron',
          },
        });
      }

      // Crear usuario con rol CUSTOMER por defecto
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: dto.fullName,
          roles: {
            connect: { id: customerRole.id },
          },
        },
        include: { roles: true },
      });

      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        roles: user.roles.map((r) => r.name),
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          ip,
          userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Crear cliente inmediatamente en operations-service (no esperar verificación de email)
      // Esto permite que la app móvil pueda acceder a los endpoints /me desde el inicio
      if (user.roles.some(r => r.name === 'CUSTOMER')) {
        this.createClientInOperations(user.id, user.email, user.fullName || undefined, dto.lat, dto.lng)
          .catch(err => this.logger.error('Failed to create client in operations during signup', err));
      }

      // Send verification email
      // Guardamos lat/lng en el token para recuperarlos después
      const verificationToken = this.generateUUID();
      await this.emailService.sendVerificationEmail(
        user.email, 
        user.id, 
        verificationToken,
        dto.lat,
        dto.lng
      );

      return Result.ok({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          roles: user.roles.map((r) => r.name),
        },
        tokens,
      });
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Signup failed'));
    }
  }

  async signin(dto: SigninDto, ip?: string, userAgent?: string): Promise<Result<Error, AuthResult>> {
    try {
      const normalizedEmail = this.normalizeEmail(dto.email);
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { roles: true },
      });

      if (!user || !user.passwordHash) {
        return Result.error(new Error('Invalid credentials'));
      }

      const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordMatch) {
        return Result.error(new Error('Invalid credentials'));
      }

      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        roles: user.roles.map((r) => r.name),
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          ip,
          userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return Result.ok({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          roles: user.roles.map((r) => r.name),
        },
        tokens,
      });
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Signin failed'));
    }
  }

  async signout(refreshToken: string): Promise<Result<Error, void>> {
    try {
      await prisma.session.deleteMany({
        where: { refreshToken },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Signout failed'));
    }
  }

  async refresh(refreshToken: string, ip?: string): Promise<Result<Error, { accessToken: string; refreshToken: string }>> {
    try {
      const decoded = this.jwtService.verifyRefreshToken(refreshToken);
      if (!decoded || !decoded.userId) {
        return Result.error(new Error('Invalid refresh token'));
      }

      const session = await prisma.session.findUnique({
        where: { refreshToken, userId: decoded.userId },
        include: { user: { include: { roles: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        if (session) await prisma.session.delete({ where: { id: session.id } });
        return Result.error(new Error('Session expired'));
      }

      // Delete old session
      await prisma.session.delete({ where: { id: session.id } });

      // Generate new tokens (rotation)
      const newTokens = this.jwtService.generateTokenPair({
        userId: session.user.id,
        email: session.user.email,
        roles: session.user.roles.map((r) => r.name),
      });

      // Create new session
      await prisma.session.create({
        data: {
          userId: session.user.id,
          refreshToken: newTokens.refreshToken,
          ip: ip || session.ip,
          userAgent: session.userAgent,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return Result.ok(newTokens);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Refresh failed'));
    }
  }

  async forgotPassword(email: string): Promise<Result<Error, void>> {
    try {
      const normalizedEmail = this.normalizeEmail(email);
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) return Result.ok(undefined); // Don't reveal if user exists

      const resetToken = this.generateUUID();
      await this.emailService.sendResetPasswordEmail(normalizedEmail, user.id, resetToken);

      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Request failed'));
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<Result<Error, void>> {
    try {
      // Find valid token in email audits
      const audits = await prisma.emailAudit.findMany({
        where: {
          type: 'RESET',
          status: 'SENT',
        },
        orderBy: { createdAt: 'desc' },
      });

      const audit = audits.find((a) => {
        const meta = a.meta as any;
        return meta?.token === token;
      });

      if (!audit || !audit.userId) {
        return Result.error(new Error('Invalid or expired token'));
      }

      // Check expiration (1 hour)
      const expiresAt = (audit.meta as any)?.expiresAt;
      if (expiresAt && expiresAt < Date.now()) {
        return Result.error(new Error('Token expired'));
      }

      // Update password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: audit.userId },
        data: { passwordHash },
      });

      // Mark token as used
      await prisma.emailAudit.update({
        where: { id: audit.id },
        data: { status: 'DELIVERED' },
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Reset failed'));
    }
  }

  async googleCallback(req: Request, res: Response): Promise<void> {
    // TODO: Implement Google OAuth callback
    // Will use Passport Google strategy
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  }

  private generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeEmail(email: string): string {
    return email?.trim().toLowerCase();
  }

  async verifyEmail(dto: { token?: string; code?: string; email?: string }): Promise<Result<Error, { verified: boolean; userId: string; email: string; isEmailVerified: boolean }>> {
    try {
      const { token, code } = dto;
      const normalizedEmail = dto.email ? this.normalizeEmail(dto.email) : undefined;

      if (!token && !code) {
        return Result.error(new Error('Token or code is required'));
      }

      // Construir filtro de búsqueda
      const whereClause: any = {
        type: 'VERIFY',
        status: { in: ['SENT', 'DELIVERED'] },
      };

      if (normalizedEmail) {
        whereClause.email = normalizedEmail;
      }

      const audits = await prisma.emailAudit.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      // Buscar por token o código
      const audit = audits.find((entry) => {
        const meta = entry.meta as { token?: string; verificationCode?: string } | null;
        if (!meta) return false;
        
        if (token && meta.token === token) return true;
        if (code && meta.verificationCode === code) return true;
        
        return false;
      });

      if (!audit || !audit.userId) {
        return Result.error(new Error('Invalid or expired token/code'));
      }

      const expiresAt = (audit.meta as any)?.expiresAt;
      if (expiresAt && expiresAt < Date.now()) {
        return Result.error(new Error('Token expired'));
      }

      // Actualizar usuario como verificado
      const user = await prisma.user.update({
        where: { id: audit.userId },
        data: { isEmailVerified: true },
        include: { roles: true },
      });

      await prisma.emailAudit.update({
        where: { id: audit.id },
        data: { status: 'DELIVERED' },
      });

      // El cliente ya fue creado en signup, así que solo verificamos que exista
      // Si por alguna razón no existe (ej: operations-service estaba caído), intentamos crearlo ahora
      if (user.roles.some(r => r.name === 'CUSTOMER')) {
        const meta = audit.meta as { lat?: number; lng?: number } | null;
        const lat = meta?.lat;
        const lng = meta?.lng;
        // Intentar crear solo si no existe (el método createClientInOperations es idempotente vía el servicio)
        this.createClientInOperations(user.id, user.email, user.fullName || undefined, lat, lng)
          .catch(err => this.logger.warn('Client may already exist after email verification', err));
      }

      // Devolver el estado de verificación
      return Result.ok({
        verified: true,
        userId: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      });
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Verification failed'));
    }
  }
}
