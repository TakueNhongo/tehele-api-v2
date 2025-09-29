import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { TeamMemberService } from './team-member.service';
import { Types } from 'mongoose';

@Controller('team-members')
@UseGuards(JwtAuthGuard)
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Post()
  async createTeamMember(@Body() teamMemberData: any) {
    return this.teamMemberService.createTeamMember(teamMemberData);
  }

  @Get('startup/:startupId')
  async getTeamMembersByStartup(@Param('startupId') startupId: string) {
    return this.teamMemberService.findTeamMembersByStartup(
      new Types.ObjectId(startupId),
    );
  }

  @Get(':id')
  async getTeamMember(@Param('id') id: string) {
    return this.teamMemberService.findTeamMemberById(new Types.ObjectId(id));
  }

  @Put(':id')
  async updateTeamMember(@Param('id') id: string, @Body() updateData: any) {
    return this.teamMemberService.updateTeamMember(
      new Types.ObjectId(id),
      updateData,
    );
  }

  @Delete(':id')
  async deleteTeamMember(@Param('id') id: string) {
    return this.teamMemberService.deleteTeamMember(new Types.ObjectId(id));
  }

  @Put(':id/link-user')
  async linkTeamMemberToUser(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.teamMemberService.linkTeamMemberToUser(
      new Types.ObjectId(id),
      new Types.ObjectId(body.userId),
    );
  }
}
