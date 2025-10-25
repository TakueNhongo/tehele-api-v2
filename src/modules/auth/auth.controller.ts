import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from 'src/decorators/public.decorator';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from '../user/dto/verify-otp.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to email for authentication' })
  async sendOTP(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOTP(sendOtpDto.email);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP and authenticate or prompt registration',
  })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Public()
  @Post('create-user')
  @ApiOperation({
    summary: 'Create user account after OTP verification',
  })
  async createUser(
    @Body()
    createUserDto: {
      firstName: string;
      lastName: string;
      email: string;
      isUsCitizen: boolean;
      isAuthorizedToWorkInUs: boolean;
    },
  ) {
    return this.authService.createUser(createUserDto);
  }

  @Public()
  @Post('activate-profile')
  @ApiOperation({
    summary: 'Activate a specific profile for an existing user',
  })
  async activateProfile(
    @Body()
    activateProfileDto: {
      userId: string;
      profileType: 'startup' | 'investor';
      profileId: string;
    },
  ) {
    return this.authService.activateProfile(
      activateProfileDto.userId,
      activateProfileDto.profileType,
      activateProfileDto.profileId,
    );
  }

  @Public()
  @Post('verify-test-account')
  @ApiOperation({
    summary: 'Verify test account without OTP (for development/testing)',
  })
  async verifyTestAccount(@Body() { email }: { email: string }) {
    console.log('verifyTestAccount', email);
    return this.authService.verifyTestAccount(email);
  }

  @Public()
  @Post('admin/send-otp')
  @ApiOperation({ summary: 'Send OTP to admin email for authentication' })
  async sendAdminOTP(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendAdminOTP(sendOtpDto.email);
  }

  @Public()
  @Post('admin/verify-otp')
  @ApiOperation({
    summary: 'Verify admin OTP and authenticate',
  })
  async verifyAdminOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyAdminOTP(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
  }

  @Get('verification-status')
  @ApiOperation({
    summary: 'Get current user verification status',
  })
  async getVerificationStatus(
    @Query('profileType') profileType: string,
    @Query('profileId') profileId: string,
  ) {
    return this.authService.getVerificationStatus(profileType, profileId);
  }
}
