import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RequestWithUser } from '../../types/requests.type';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('startup/:id/message')
  async sendMessage(
    @Param('id') startupId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: RequestWithUser,
  ) {
    return this.chatService.sendMessage(
      startupId,
      req.user._id.toString(),
      sendMessageDto,
    );
  }

  @Get('startup/:id/conversation')
  async getConversation(
    @Param('id') startupId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.chatService.getConversation(startupId, req.user._id.toString());
  }

  @Delete('startup/:id/conversation')
  async clearConversation(
    @Param('id') startupId: string,
    @Req() req: RequestWithUser,
  ) {
    await this.chatService.clearConversation(
      startupId,
      req.user._id.toString(),
    );
    return { message: 'Conversation cleared successfully' };
  }
}
