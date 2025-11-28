import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  type?: 'access' | 'refresh';
}

@Injectable()
export class JwtService {
  private accessSecret: string;
  private refreshSecret: string;
  private accessTTL: string;
  private refreshTTL: string;

  constructor(private configService: ConfigService) {
    this.accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || '';
    this.refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || '';
    this.accessTTL = this.configService.get<string>('JWT_ACCESS_TTL', '900s');
    this.refreshTTL = this.configService.get<string>('JWT_REFRESH_TTL', '30d');
  }

  generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
    const accessOptions: jwt.SignOptions = { expiresIn: this.accessTTL as jwt.SignOptions['expiresIn'] };
    const refreshOptions: jwt.SignOptions = { expiresIn: this.refreshTTL as jwt.SignOptions['expiresIn'] };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.accessSecret as jwt.Secret,
      accessOptions
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh', userId: payload.userId },
      this.refreshSecret as jwt.Secret,
      refreshOptions
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshSecret) as TokenPayload;
  }
}
