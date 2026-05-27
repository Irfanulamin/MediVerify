import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Request() req: any) {
    const user = await this.usersService.findByEmail(req.user.email);
    if (!user) return { email: req.user.email, role: req.user.role, profile: {} };
    return {
      email: user.email,
      role: user.role,
      name: user.name,
      profile: user.profile ?? {},
    };
  }

  @Patch('profile')
  async updateProfile(
    @Body() body: { displayName?: string; medications?: string[]; allergies?: string[] },
    @Request() req: any,
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }
}
