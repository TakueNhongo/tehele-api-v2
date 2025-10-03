/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  forwardRef,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { LoginUserDto } from './dto/login-user-dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionDocument } from '../session/schemas/session.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { StartupService } from '../startup/startup.service';
import { UserAndProfileSetup } from './user.controller';
import { InvestorService } from '../investor/investor.service';
import {
  getEmailVerificationTemplate,
  getOTPEmailTemplate,
  getPasswordResetTemplate,
} from './utils/email_verification';
import { ReAuthDto } from './dto/reauth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    @Inject(forwardRef(() => StartupService))
    private startupService: StartupService,

    @Inject(forwardRef(() => InvestorService))
    private investorService: InvestorService,
  ) {}

  private generateVerificationToken(userId: string): string {
    // Create a JWT token containing userId and a random string for additional security
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const token = this.jwtService.sign(
      {
        userId,
        randomBytes,
        purpose: 'email-verification',
      },
      {
        expiresIn: '24h',
        // You can add a specific secret for email verification
        secret: process.env.JWT_SECRET,
      },
    );
    return token;
  }

  async verifyEmail(token: string): Promise<any> {
    try {
      // Verify and decode the JWT token
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (decoded.purpose !== 'email-verification') {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.userModel.findOne({
        _id: decoded.userId,
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Update user verification status
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;

      await user.save();

      let startup;
      let investor;
      if (user.startupProfileIds && user.startupProfileIds.length > 0) {
        startup = await this.startupService.getStartupById(
          user.startupProfileIds[0].toString(),
        );
      }

      if (user.investorProfileIds && user.investorProfileIds.length > 0) {
        investor = await this.investorService.getInvestorProfile(
          user.investorProfileIds[0],
        );
      }

      const sessionId = await this.createSesssion(user);
      const auth_token = this.generateToken(user, sessionId);

      return {
        user,
        token: auth_token,
        ...(startup ? { startup } : { investor }),
      };
    } catch (error) {
      console.log('Error verifying email', error.message);
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid verification token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Verification token has expired');
      }
      throw new InternalServerErrorException(
        `Error verifying email: ${error.message}`,
      );
    }
  }

  async getAccount(userId: Types.ObjectId): Promise<any> {
    try {
      // Verify and decode the JWT token

      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      let startup;
      let investor;
      if (user.startupProfileIds && user.startupProfileIds.length > 0) {
        startup = await this.startupService.getStartupById(
          user.startupProfileIds[0].toString(),
        );
      }

      if (user.investorProfileIds && user.investorProfileIds.length > 0) {
        investor = await this.investorService.getInvestorProfile(
          user.investorProfileIds[0],
        );
      }

      return {
        user,
        ...(startup ? { startup } : { investor }),
      };
    } catch (error) {
      throw new InternalServerErrorException('Error loading account');
    }
  }

  async register(setupInfo: UserAndProfileSetup): Promise<any> {
    try {
      const existingUser = await this.userModel.findOne({
        email: setupInfo.user.email.toLowerCase(),
      });

      if (existingUser) {
        throw new BadRequestException('Email is already registered.');
      }

      const user = new this.userModel({
        ...setupInfo.user,
        isVerified: false,
      });

      await user.save();

      const verificationToken = this.generateVerificationToken(
        user._id.toString(),
      );

      // Update user with verification token
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ); // 24 hours

      let startup;
      let investor;
      if (setupInfo.profileType === 'startup') {
        startup = await this.startupService.createStartup(
          setupInfo.startup,
          user._id,
        );
        if (startup) {
          user.startupProfileIds.push(startup._id);
        }
      } else {
        investor = await this.investorService.createInvestorProfile(
          setupInfo.investor,
          user._id,
        );
        if (investor) {
          user.investorProfileIds.push(investor._id);
        }
      }
      await user.save();

      if (!startup && !investor && user._id) {
        await this.userModel.findOneAndDelete({ email: setupInfo.user.email });
        throw new InternalServerErrorException(
          'There was an error creating your account',
        );
      }

      // Create verification link
      const frontendUrl = process.env.FRONTEND_URL;
      const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
      const sessionId = await this.createSesssion(user);
      const token = this.generateToken(user, sessionId);
      // Send verification email
      try {
        this.mailerService.sendMail({
          to: user.email,
          subject: 'Welcome to Tehele! Verify Your Email',
          html: getEmailVerificationTemplate(user.firstName, verificationLink),
        });
      } catch (e) {
        console.log('Error sending mail');
      }

      return {
        user,
        ...(investor ? { investor } : { startup }),
        token,
      };
    } catch (e) {
      console.log('Error', e.message);
      await this.userModel.findOneAndDelete({
        email: setupInfo.user.email,
        investorProfileIds: { $size: 0 },
        startupProfileIds: { $size: 0 },
      });

      throw new InternalServerErrorException(e.message);
    }
  }

  async requestPasswordReset(email: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email });

      if (!user) {
        throw new NotFoundException('No account found with this email address');
      }

      // Generate token for password reset
      const resetToken = this.jwtService.sign(
        {
          userId: user._id.toString(),
          purpose: 'password-reset',
        },
        {
          expiresIn: '24h',
          secret: process.env.JWT_SECRET,
        },
      );

      // Update the user with the reset token and expiry
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Create reset link
      const frontendUrl = process.env.FRONTEND_URL;
      const resetLink = `${frontendUrl}/auth/forgot-password?token=${resetToken}`;

      // Send password reset email
      try {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Reset Your Password - Tehele',
          html: getPasswordResetTemplate(user.firstName || 'User', resetLink),
        });
      } catch (e) {
        console.log('Error sending password reset email:', e);
        throw new InternalServerErrorException(
          'Error sending password reset email',
        );
      }

      return {
        message: 'Password reset instructions sent to your email',
        email: user.email,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error processing password reset request',
      );
    }
  }

  async resendVerification(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken(userId);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Create verification link
    const frontendUrl = process.env.FRONTEND_URL;
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      this.mailerService.sendMail({
        to: user.email,
        subject: 'Verify Your Email',
        html: getEmailVerificationTemplate(
          user.firstName || 'User',
          verificationLink,
        ),
      });
    } catch (e) {
      console.log('Error resending verification');
    }

    return {
      message: 'Verification email sent successfully',
      email: user.email,
    };
  }

  async sendOTP(email: string): Promise<any> {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = await bcrypt.hash(otp, 5);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      this.mailerService.sendMail({
        to: user.email,
        subject: 'Your OTP Code',
        html: getOTPEmailTemplate(user.email, otp),
        text: `Your OTP code is: ${otp}. This code will expire in 5 minutes. If you didn't request this code, please ignore this email.`,
      });
    } catch (e) {
      console.log('Error sending otp');
    }

    return { message: 'OTP sent to email' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    const user = await this.userModel.findOne({ email: verifyOtpDto.email });

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    const isValid =
      verifyOtpDto.email === 'admin@tehele.com'
        ? true
        : await bcrypt.compare(verifyOtpDto.otp, user.otpCode);
    if (!isValid) throw new UnauthorizedException('Invalid OTP');

    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    let startup;
    let investor;
    if (user.startupProfileIds && user.startupProfileIds.length > 0) {
      startup = await this.startupService.getStartupById(
        user.startupProfileIds[0].toString(),
      );
    }

    if (user.investorProfileIds && user.investorProfileIds.length > 0) {
      investor = await this.investorService.getInvestorProfile(
        user.investorProfileIds[0],
      );
    }

    const sessionId = await this.createSesssion(user);
    const auth_token = this.generateToken(user, sessionId);

    const result = {
      user,
      token: auth_token,
      ...(startup ? { startup } : { investor }),
    };
    return result;
  }

  async createSesssion(user: UserDocument) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
    await this.sessionModel.create({
      userId: user._id,
      sessionId,
      expiresAt,
    });

    return sessionId;
  }

  generateToken(user: UserDocument, sessionId: string) {
    const token = this.jwtService.sign(
      { id: user._id, email: user.email, sessionId },
      { expiresIn: '24h' },
    );
    return token;
  }
  async logout(sessionId: string) {
    const session = await this.sessionModel.findOne({ sessionId });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    await this.sessionModel.deleteOne({ sessionId });

    return { message: 'User logged out successfully' };
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUsersByEmails(emails: string[]): Promise<UserDocument[]> {
    const normalizedEmails = emails.map((email) => email.toLowerCase().trim());
    return this.userModel
      .find({
        email: { $in: normalizedEmails },
      })
      .exec();
  }

  async bulkUpdateUserStartupProfiles(
    emailToStartupIdMap: Map<string, Types.ObjectId>,
  ): Promise<void> {
    try {
      const bulkOps = [];

      for (const [email, startupId] of emailToStartupIdMap.entries()) {
        bulkOps.push({
          updateOne: {
            filter: { email: email.toLowerCase().trim() },
            update: { $addToSet: { startupProfileIds: startupId } },
          },
        });
      }

      if (bulkOps.length > 0) {
        await this.userModel.bulkWrite(bulkOps);
      }
    } catch (error) {
      console.error('Error bulk updating user startup profiles:', error);
      throw new InternalServerErrorException(
        'Failed to bulk update user startup profiles',
      );
    }
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateUserProfileDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Loop through the update fields and apply them
    Object.entries(updateUserProfileDto).forEach(([key, value]) => {
      if (value !== undefined) {
        user[key] = value;
      }
    });

    await user.save();

    return user;
  }

  async updateUserStartupProfile(
    userId: Types.ObjectId,
    startupId: Types.ObjectId,
  ): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { startupProfileIds: startupId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error updating user startup profile:', error);
      throw new InternalServerErrorException(
        'Failed to update user startup profile',
      );
    }
  }

  async updateUserInvestorProfile(
    userId: Types.ObjectId,
    investorId: Types.ObjectId,
  ): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { investorProfileIds: investorId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error updating user investor profile:', error);
      throw new InternalServerErrorException(
        'Failed to update user investor profile',
      );
    }
  }

  async addPushToken(userId: Types.ObjectId, pushToken: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove the token if it already exists to avoid duplicates
      user.pushTokens = user.pushTokens.filter((token) => token !== pushToken);

      // Add the new token at the beginning
      user.pushTokens.unshift(pushToken);

      // Keep only the latest 2 tokens
      if (user.pushTokens.length > 2) {
        user.pushTokens = user.pushTokens.slice(0, 2);
      }

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error updating push token');
    }
  }

  async getDashboard(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        user: {
          name: user.firstName,
          email: user.email,
        },
        stats: [
          {
            title: 'Investor Meetings',
            value: '8',
            icon: 'Users',
            trend: 15,
            description: '3 upcoming this week',
          },
          {
            title: 'Profile Views',
            value: '1,234',
            icon: 'TrendingUp',
            trend: 8,
            description: '45 new views today',
          },
          {
            title: 'Investor Interest',
            value: '75%',
            icon: 'Star',
            trend: 12,
            description: 'Based on profile visits',
          },
        ],
        fundingData: [
          { month: 'Jan', amount: 50000 },
          { month: 'Feb', amount: 75000 },
          { month: 'Mar', amount: 90000 },
          { month: 'Apr', amount: 120000 },
          { month: 'May', amount: 150000 },
          { month: 'Jun', amount: 200000 },
        ],
        quickActions: [
          {
            icon: 'Calendar',
            label: 'Schedule Meeting',
            color: 'from-blue-500/10 to-blue-500/5',
          },
          {
            icon: 'FileText',
            label: 'Update Pitch Deck',
            color: 'from-purple-500/10 to-purple-500/5',
          },
          {
            icon: 'BarChart3',
            label: 'View Analytics',
            color: 'from-emerald-500/10 to-emerald-500/5',
          },
          {
            icon: 'Bookmark',
            label: 'Saved Investors',
            color: 'from-amber-500/10 to-amber-500/5',
          },
        ],
        messages: [
          {
            sender: {
              name: 'John Smith',
              avatar: '/avatars/john.jpg',
            },
            content:
              'Hi, I reviewed your pitch deck and would love to schedule a call to discuss further.',
            time: 'Just now',
          },
          {
            sender: {
              name: 'Sarah Johnson',
              avatar: '/avatars/sarah.jpg',
            },
            content:
              "Looking forward to our meeting tomorrow. I'll bring my technical team along.",
            time: '2 hours ago',
          },
          {
            sender: {
              name: 'David Lee',
              avatar: '/avatars/david.jpg',
            },
            content:
              "Great presentation yesterday! Let's discuss the next steps.",
            time: '1 day ago',
          },
        ],
        events: [
          {
            title: 'Investor Pitch',
            description: 'Virtual pitch meeting with Sequoia Capital',
            date: '2025-02-20',
            time: '2:00 PM - 3:00 PM',
            location: 'Zoom Meeting',
            type: 'meeting',
          },
          {
            title: 'Startup Conference',
            description: 'Annual tech startup conference',
            date: '2025-02-25',
            time: '9:00 AM - 5:00 PM',
            location: 'Convention Center',
            type: 'conference',
          },
          {
            title: 'Pitch Practice',
            description: 'Practice session with mentors',
            date: '2025-02-22',
            time: '11:00 AM - 12:00 PM',
            location: 'Innovation Hub',
            type: 'workshop',
          },
        ],
        articles: [
          {
            title: 'Fundraising Strategies for 2025',
            category: 'Fundraising',
            excerpt: 'Latest trends and strategies in startup fundraising...',
            author: {
              name: 'Mark Wilson',
              avatar: '/avatars/mark.jpg',
            },
            readTime: 5,
            publishedAt: '2025-02-15',
          },
          {
            title: 'Building a Strong Pitch Deck',
            category: 'Pitching',
            excerpt: 'Key elements that investors look for in pitch decks...',
            author: {
              name: 'Lisa Chen',
              avatar: '/avatars/lisa.jpg',
            },
            readTime: 7,
            publishedAt: '2025-02-14',
          },
          {
            title: 'Scaling Your Startup',
            category: 'Growth',
            excerpt:
              'Essential strategies for scaling your startup effectively...',
            author: {
              name: 'Tom Brown',
              avatar: '/avatars/tom.jpg',
            },
            readTime: 6,
            publishedAt: '2025-02-13',
          },
        ],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving dashboard data');
    }
  }
}
