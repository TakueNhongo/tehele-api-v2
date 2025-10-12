import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { getOTPEmailTemplate } from '../user/utils/email_verification';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDocument } from '../session/schemas/session.schema';
import { StartupService } from '../startup/startup.service';
import { InvestorService } from '../investor/investor.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private mailerService: MailerService,
    private jwtService: JwtService,
    private startupService: StartupService,
    private investorService: InvestorService,
  ) {}

  async sendOTP(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 5);

    // Store OTP (update existing or create new one for this email)
    // Send OTP email (always send, regardless of whether user exists)
    try {
      await Promise.all([
        this.otpModel.findOneAndUpdate(
          {
            email: normalizedEmail,
          },
          {
            $set: {
              otpCode: hashedOtp,
              expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
              isUsed: false,
              attempts: 0,
            },
          },
          { upsert: true, new: true },
        ),
        this.mailerService.sendMail({
          to: normalizedEmail,
          subject: 'Your Tehele Verification Code',
          html: getOTPEmailTemplate(normalizedEmail, otp),
          text: `Your OTP code is: ${otp}. This code will expire in 5 minutes.`,
        }),
      ]);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // Don't throw error to avoid revealing email sending issues
    }

    return { message: 'OTP sent to email' };
  }

  async verifyOTP(email: string, otpCode: string): Promise<any> {
    const normalizedEmail = email.toLowerCase();

    // Find valid OTP
    const otpRecord = await this.otpModel.findOne({
      email: normalizedEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otpCode, otpRecord.otpCode);

    if (!isValidOtp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if user exists
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      // User doesn't exist - return indicator for registration
      return {
        userExists: false,
        email: normalizedEmail,
        message: 'Please complete registration',
      };
    }

    // User exists - get all profiles for selection
    let allStartups = [];
    let allInvestors = [];

    if (user.startupProfileIds && user.startupProfileIds.length > 0) {
      allStartups = await Promise.all(
        user.startupProfileIds.map((id) =>
          this.startupService.getStartupByIdForAuth(id.toString()),
        ),
      );
    }

    if (user.investorProfileIds && user.investorProfileIds.length > 0) {
      allInvestors = await Promise.all(
        user.investorProfileIds.map((id) =>
          this.investorService.getInvestorProfileForAuth(id),
        ),
      );
    }

    // Create session and generate token for existing user
    const sessionId = await this.createSession(user);
    const token = this.generateToken(user, sessionId);

    // If user has profiles, return them for selection
    if (allStartups.length > 0 || allInvestors.length > 0) {
      return {
        userExists: true,
        user,
        token,
        profiles: {
          startups: allStartups.filter((startup) => startup !== null),
          investors: allInvestors.filter((investor) => investor !== null),
        },
        message: 'Select a profile to continue',
      };
    }

    // User exists but has no profiles - they need to create one
    return {
      userExists: true,
      user,
      token,
      profiles: {
        startups: [],
        investors: [],
      },
      message: 'Create your first profile',
    };
  }

  private async createSession(user: UserDocument): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.sessionModel.create({
      userId: user._id,
      sessionId,
      expiresAt,
    });

    return sessionId;
  }

  private generateToken(user: UserDocument, sessionId: string): string {
    return this.jwtService.sign(
      { id: user._id, email: user.email, sessionId },
      { expiresIn: '24h' },
    );
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    isUsCitizen: boolean;
    isAuthorizedToWorkInUs: boolean;
  }): Promise<any> {
    const normalizedEmail = userData.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
    });
    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    // Create user with temporary password (they'll use OTP-based auth)
    const tempPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await this.userModel.create({
      email: normalizedEmail,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: hashedPassword,
      isUsCitizen: userData.isUsCitizen,
      isAuthorizedToWorkInUs: userData.isAuthorizedToWorkInUs,
      isVerified: true, // Since they completed OTP verification
    });

    // Create session and generate token
    const sessionId = await this.createSession(newUser);
    const token = this.generateToken(newUser, sessionId);

    return {
      user: newUser,
      token,
      message: 'User account created successfully',
    };
  }

  async activateProfile(
    userId: string,
    profileType: 'startup' | 'investor',
    profileId: string,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify the profile belongs to the user
    if (profileType === 'startup') {
      if (!user.startupProfileIds.includes(profileId as any)) {
        throw new BadRequestException('Profile not found or unauthorized');
      }
      const startup = await this.startupService.getStartupById(profileId);
      if (!startup) {
        throw new BadRequestException('Startup profile not found');
      }
    } else if (profileType === 'investor') {
      if (!user.investorProfileIds.includes(profileId as any)) {
        throw new BadRequestException('Profile not found or unauthorized');
      }
      const investor = await this.investorService.getInvestorProfile(
        new Types.ObjectId(profileId),
      );
      if (!investor) {
        throw new BadRequestException('Investor profile not found');
      }
    }

    // Create session and generate token
    const sessionId = await this.createSession(user);
    const token = this.generateToken(user, sessionId);

    // Get the activated profile
    let profile;
    if (profileType === 'startup') {
      profile = await this.startupService.getStartupById(profileId);
    } else {
      profile = await this.investorService.getInvestorProfile(
        new Types.ObjectId(profileId),
      );
    }

    return {
      user,
      token,
      [profileType]: profile,
    };
  }

  async verifyTestAccount(email: string): Promise<any> {
    const normalizedEmail = email.toLowerCase();

    // Define test account emails
    const TEST_ACCOUNTS = ['mctaruk@gmail.com', 'takudzwanhongo6@gmail.com'];

    // Check if this is a valid test account
    if (!TEST_ACCOUNTS.includes(normalizedEmail)) {
      throw new BadRequestException('Invalid test account email');
    }

    // Check if user exists
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      // User doesn't exist - return indicator for registration
      return {
        userExists: false,
        email: normalizedEmail,
        message: 'Please complete registration',
      };
    }

    // User exists - get all profiles for selection
    let allStartups = [];
    let allInvestors = [];

    if (user.startupProfileIds && user.startupProfileIds.length > 0) {
      allStartups = await Promise.all(
        user.startupProfileIds.map((id) =>
          this.startupService.getStartupByIdForAuth(id.toString()),
        ),
      );
    }

    if (user.investorProfileIds && user.investorProfileIds.length > 0) {
      allInvestors = await Promise.all(
        user.investorProfileIds.map((id) =>
          this.investorService.getInvestorProfileForAuth(id),
        ),
      );
    }

    // Create session and generate token for existing user
    const sessionId = await this.createSession(user);
    const token = this.generateToken(user, sessionId);

    // If user has profiles, return them for selection
    if (allStartups.length > 0 || allInvestors.length > 0) {
      return {
        userExists: true,
        user,
        token,
        profiles: {
          startups: allStartups.filter((startup) => startup !== null),
          investors: allInvestors.filter((investor) => investor !== null),
        },
        message: 'Select a profile to continue',
      };
    }

    // User exists but has no profiles - they need to create one
    return {
      userExists: true,
      user,
      token,
      profiles: {
        startups: [],
        investors: [],
      },
      message: 'Create your first profile',
    };
  }
}
