import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Types } from 'mongoose';
import { SearchRecipientsDto } from './dto/search-recipients.dto';
import { StartupService } from '../startup/startup.service';
import { InvestorService } from '../investor/investor.service';
import { MessageFolderEnum } from './enums/message.enums';
import { SaveDraftDto } from './dto/save-draft.dto';

@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly startupService: StartupService,
    private readonly investorService: InvestorService,
  ) {}

  @Get('recipients')
  async getAvailableRecipients(
    @Req() req: RequestWithUser,
    @Query() searchDto: SearchRecipientsDto,
  ) {
    return this.messageService.getAvailableRecipients(
      req.profileId,
      req.profileType,
      searchDto.search,
    );
  }

  @Delete(':messageId')
  async deleteMessage(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.deleteMessage(
      new Types.ObjectId(messageId),
      req.profileId,
    );
  }

  @Get('folder/:folder')
  async getMessagesByFolder(
    @Req() req: RequestWithUser,
    @Param('folder') folder: MessageFolderEnum,
  ) {
    const results = await this.messageService.getMessagesByFolder(
      req.profileId,
      folder,
    );

    return results;
  }

  @Get(':messageId/with-thread')
  async getMessageWithThread(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.getMessageWithThread(
      new Types.ObjectId(messageId),
      req.profileId,
    );
  }

  @Get('thread/:messageId')
  async getMessageThread(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.getMessageThread(
      new Types.ObjectId(messageId),
      req.profileId,
    );
  }

  @Post('send')
  async sendMessage(
    @Req() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    console.log(createMessageDto);
    return this.messageService.createMessage(
      createMessageDto,
      req.user._id,
      req.profileId,
      req.profileType,
    );
  }

  @Post('draft')
  async saveDraft(
    @Req() req: RequestWithUser,
    @Body() saveDraftDto: SaveDraftDto,
  ) {
    return this.messageService.saveDraft(
      req.user._id,
      req.profileId,
      req.profileType,
      saveDraftDto,
    );
  }

  @Get('stats')
  async getFolderStats(@Req() req: RequestWithUser) {
    return this.messageService.getFolderStats(req.profileId);
  }

  @Put(':messageId/read')
  async markAsRead(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.markAsRead(
      new Types.ObjectId(messageId),
      req.profileId,
    );
  }

  @Put(':messageId/status')
  async updateMessageStatus(
    @Req() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.updateMessageStatus(
      new Types.ObjectId(messageId),
      updateMessageDto,
      req.profileId,
      req.profileType,
    );
  }
}
