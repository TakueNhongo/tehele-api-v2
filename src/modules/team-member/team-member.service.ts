import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeamMember, TeamMemberDocument } from './schemas/team-member.schema';
import { UserService } from '../user/user.service';
import { Startup, StartupDocument } from '../startup/schemas/startup.schema';

@Injectable()
export class TeamMemberService {
  constructor(
    @InjectModel(TeamMember.name)
    private teamMemberModel: Model<TeamMemberDocument>,
    @InjectModel(Startup.name)
    private startupModel: Model<StartupDocument>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async findTeamMembersByStartup(
    startupId: Types.ObjectId,
  ): Promise<TeamMember[]> {
    return this.teamMemberModel.find({ startupId, isActive: true }).exec();
  }

  async findTeamMemberById(id: Types.ObjectId): Promise<TeamMember> {
    return this.teamMemberModel.findById(id).exec();
  }

  async linkTeamMemberToUser(
    teamMemberId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<TeamMember> {
    return this.teamMemberModel
      .findByIdAndUpdate(teamMemberId, { userId }, { new: true })
      .exec();
  }

  async findTeamMembersByEmail(email: string): Promise<TeamMember[]> {
    return this.teamMemberModel.find({ email, isActive: true }).exec();
  }

  async findTeamMembersByUserId(userId: Types.ObjectId): Promise<TeamMember[]> {
    return this.teamMemberModel.find({ userId, isActive: true }).exec();
  }

  async bulkCreateTeamMembers(
    teamMembers: Partial<TeamMember>[],
  ): Promise<TeamMemberDocument[]> {
    try {
      return (await this.teamMemberModel.insertMany(
        teamMembers,
      )) as TeamMemberDocument[];
    } catch (error) {
      console.error('Error bulk creating team members:', error);
      throw new Error('Failed to bulk create team members');
    }
  }

  async findTeamMembersByEmails(emails: string[]): Promise<TeamMember[]> {
    const normalizedEmails = emails.map((email) => email.toLowerCase().trim());
    return this.teamMemberModel
      .find({
        email: { $in: normalizedEmails },
        isActive: true,
      })
      .exec();
  }

  // Sync startup's team array with active team members
  async syncStartupTeamArray(startupId: Types.ObjectId): Promise<void> {
    try {
      // Get all active team members for this startup
      const activeTeamMembers = await this.teamMemberModel
        .find({ startupId, isActive: true })
        .select('_id')
        .exec();

      // Update startup's team array with active team member IDs
      await this.startupModel.findByIdAndUpdate(startupId, {
        team: activeTeamMembers.map((member) => member._id),
      });
    } catch (error) {
      console.error('Error syncing startup team array:', error);
      throw error;
    }
  }

  async createTeamMember(
    teamMemberData: Partial<TeamMember>,
  ): Promise<TeamMember> {
    const teamMember = new this.teamMemberModel(teamMemberData);
    const savedMember = await teamMember.save();

    // Sync startup team array after creation
    if (teamMemberData.startupId) {
      await this.syncStartupTeamArray(teamMemberData.startupId);
    }

    return savedMember;
  }

  // Override update method to sync startup team array
  async updateTeamMember(
    id: Types.ObjectId,
    updateData: Partial<TeamMember>,
  ): Promise<TeamMember> {
    const updatedMember = await this.teamMemberModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    // Sync startup team array after update
    if (updatedMember && updatedMember.startupId) {
      await this.syncStartupTeamArray(updatedMember.startupId);
    }

    return updatedMember;
  }

  // Override delete method to sync startup team array
  async deleteTeamMember(id: Types.ObjectId): Promise<TeamMember | null> {
    // Find the team member to get the startupId before deletion
    const teamMember = await this.teamMemberModel.findById(id).exec();

    if (!teamMember) {
      return null;
    }

    // Actually delete the team member document
    await this.teamMemberModel.findByIdAndDelete(id).exec();

    // Sync startup team array after deletion
    if (teamMember.startupId) {
      await this.syncStartupTeamArray(teamMember.startupId);
    }

    // Return the deleted member (or null if you prefer)
    return teamMember;
  }
}
