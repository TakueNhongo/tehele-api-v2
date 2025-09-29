import {
  Controller,
  Post,
  Body,
  Req,
  Put,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user-dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from 'src/decorators/public.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateStartupDto } from '../startup/dto/create-startup.dto';
import { CreateInvestorDto } from '../investor/dto/investor.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ReAuthDto } from './dto/reauth.dto';

export interface UserAndProfileSetup {
  user: CreateUserDto;
  profileType: 'startup' | 'investor';
  investor?: CreateInvestorDto;
  startup?: CreateStartupDto;
}

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body()
    setup: UserAndProfileSetup,
  ) {
    return this.userService.register(setup);
  }

  @Public()
  @Post('seed')
  @ApiOperation({ summary: 'Bulk add multiple users and startups for testing' })
  async bulkAddUsersAndStartups(@Body() bulkData: UserAndProfileSetup[]) {
    const results = [];

    for (const setup of bulkData) {
      try {
        const result = await this.userService.register(setup);
        results.push({
          success: true,
          email: setup.user.email,
          result,
        });
      } catch (error) {
        results.push({
          success: false,
          email: setup.user.email,
          error: error.message,
        });
      }
    }

    return {
      total: bulkData.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email for authentication' })
  async sendOTP(@Body() body: { email: string }) {
    return this.userService.sendOTP(body.email);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and get OTP' })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Public()
  @Post('reauth')
  @ApiOperation({ summary: 'Re-authenticate user' })
  async reAuthenticate(@Body() reAuthDto: ReAuthDto) {
    return this.userService.reAuthenticate(reAuthDto);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Query() verifyEmailDto: VerifyEmailDto) {
    return this.userService.verifyEmail(verifyEmailDto.token);
  }

  @Get('account')
  @ApiOperation({ summary: 'Verify email with token' })
  async getUserAndProfile(@Req() req: RequestWithUser) {
    return this.userService.getAccount(req.user._id);
  }

  @Public()
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request password reset email' })
  async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
    return this.userService.requestPasswordReset(requestDto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.userService.resetPassword(resetDto.token, resetDto.newPassword);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  async getDashboard(@Req() req) {
    const userId = req.user.id;
    return this.userService.getDashboard(userId);
  }

  @Public()
  @Post('resend-verification/:userId')
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Param('userId') userId: string) {
    return this.userService.resendVerification(userId);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and authenticate user' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.userService.verifyOtp(verifyOtpDto);
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Log out user' })
  async logout(@Req() req) {
    const sessionId = req.user.sessionId;
    return this.userService.logout(sessionId);
  }

  @Put('update-profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateUserProfileDto: UpdateUserDto,
  ) {
    const userId = req.user._id;
    if (updateUserProfileDto.newPassword) {
      return this.userService.updatePassword(
        userId,
        updateUserProfileDto.currentPassword,
        updateUserProfileDto.newPassword,
      );
    } else {
      return this.userService.updateProfile(userId, updateUserProfileDto);
    }
  }
}
