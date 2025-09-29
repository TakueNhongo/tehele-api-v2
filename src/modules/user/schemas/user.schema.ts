import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum KYCDocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;
  @Prop({ type: Boolean, default: false })
  isUsCitizen: boolean; // US citizenship status

  @Prop({ type: Boolean, default: false })
  isAuthorizedToWorkInUs: boolean; // US work authorization status

  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String, default: null })
  profilePictureFileId?: string; // GridFS file ID

  @Prop({ type: String, default: null })
  otpCode: string; // OTP for 2FA

  @Prop({ type: Date, default: null })
  otpExpiresAt: Date; // Expiry time for OTP

  @Prop({ type: Boolean, default: false })
  isVerified: boolean; // Email verification

  @Prop({ type: Boolean, default: false })
  isRejected: boolean; // kyc

  @Prop({ type: Boolean, default: true })
  isActive: boolean; // Whether user is active

  @Prop({ type: Boolean, default: false })
  isAdmin: boolean; // Admin role

  @Prop({ type: String, default: null })
  verificationToken?: string; // Email verification token

  @Prop({ type: String, default: null })
  passwordResetToken: string; // Password reset token

  @Prop({ type: Date, default: null })
  passwordResetExpires: Date; // Password reset token expiry

  @Prop({ type: Date, default: null })
  verificationTokenExpires: Date; // Email verification token expiry

  @Prop({ type: [Types.ObjectId], ref: 'Startup', default: [] })
  startupProfileIds: Types.ObjectId[]; // References to startup profiles

  @Prop({ type: [Types.ObjectId], ref: 'Investor', default: [] })
  investorProfileIds: Types.ObjectId[]; // References to investor profiles
}

export const UserSchema = SchemaFactory.createForClass(User);
