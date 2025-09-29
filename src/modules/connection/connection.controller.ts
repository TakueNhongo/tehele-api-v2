import { Controller, Post, Get, Put, Param, Body, Req } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Types } from 'mongoose';

@Controller('connection')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post('startup/:startupId')
  async createConnection(
    @Req() req: RequestWithUser,
    @Param('startupId') startupId: string,
    @Body() createConnectionDto: CreateConnectionDto,
  ) {
    return this.connectionService.createConnection(
      { ...createConnectionDto, startupId: new Types.ObjectId(startupId) },
      req.profileId,
      req.profileType,
    );
  }

  @Get('investor/connections')
  async getInvestorConnections(@Req() req: RequestWithUser) {
    return this.connectionService.getConnectionsByInvestor(req.profileId);
  }

  @Get('startup/connections')
  async getStartupConnections(@Req() req: RequestWithUser) {
    return this.connectionService.getConnectionsByStartup(req.profileId);
  }

  @Put(':connectionId')
  async updateConnection(
    @Req() req: RequestWithUser,
    @Param('connectionId') connectionId: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ) {
    return this.connectionService.updateConnection(
      new Types.ObjectId(connectionId),
      updateConnectionDto,
      req.profileId,
      req.profileType,
    );
  }

  @Get(':connectionId')
  async getConnectionStatus(@Param('connectionId') connectionId: string) {
    return this.connectionService.getConnectionById(
      new Types.ObjectId(connectionId),
    );
  }
}
