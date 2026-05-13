import { Controller, Post, Put, Body, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }
    return this.authService.register(body.username, body.password);
  }

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }
    return this.authService.login(body.username, body.password);
  }

  @Put('password')
  async changePassword(
    @Request() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestException('Old password and new password are required');
    }
    return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }
}
