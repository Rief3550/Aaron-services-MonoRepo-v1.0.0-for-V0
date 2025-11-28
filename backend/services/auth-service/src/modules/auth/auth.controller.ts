import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { toApiResponse } from '../common/api-response.util';

import { AuthService } from './auth.service';
import {
  SignupDto,
  SigninDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    const result = await this.authService.signup(dto, ip, userAgent);
    return toApiResponse(result);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() dto: SigninDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    const result = await this.authService.signin(dto, ip, userAgent);

    if (result._tag === 'ok') {
      // Set HttpOnly Cookies
      res.cookie('accessToken', result.value.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refreshToken', result.value.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return toApiResponse(result);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signout(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    if (refreshToken) {
      await this.authService.signout(refreshToken);
    }
    
    return toApiResponse(null, { message: 'Signed out successfully' });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.refresh(refreshToken, ip);
    return toApiResponse(result);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return toApiResponse(result, { message: 'If the email exists, a reset link has been sent' });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto.token, dto.password);
    return toApiResponse(result, { message: 'Password reset successfully' });
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail({
      token: dto.token,
      code: dto.code,
      email: dto.email,
    });
    
    return toApiResponse(result, { message: 'Email verified successfully' });
  }

  @Get('google')
  @UseGuards(JwtAuthGuard)
  async googleAuth() {
    // Passport handles redirect
  }

  @Get('google/callback')
  @UseGuards(JwtAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.authService.googleCallback(req, res);
  }
}
