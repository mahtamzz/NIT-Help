import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  encodeUserContext,
  GATEWAY_HEADERS,
  Public,
} from '@nit-help/microservice-common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود به سامانه با نام کاربری یا ایمیل' })
  async login(
    @Body() body: { usernameOrEmail?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.usernameOrEmail || '',
      body.password || '',
    );
    return this.authService.login(user, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تولید مجدد توکن دسترسی با کوکی رفرش توکن' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    return this.authService.refresh(refreshToken, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'خروج از سامانه و حذف کوکی احراز هویت' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req.cookies?.refreshToken, res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت مشخصات کاربر جاری وارد شده' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Public()
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'بررسی داخلی توکن برای Nginx auth_request' })
  async verify(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.verifyAccessToken(req.headers.authorization);
    res.setHeader(GATEWAY_HEADERS.USER_CONTEXT, encodeUserContext(user));
    return { valid: true };
  }
}
