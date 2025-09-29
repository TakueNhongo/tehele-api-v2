import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAI } from 'openai';
import {
  ChatConversation,
  ChatConversationDocument,
} from './schemas/chat-conversation.schema';
import { ChatMessage, MessageRole } from './schemas/chat-message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { StartupService } from '../startup/startup.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name)
    private chatConversationModel: Model<ChatConversationDocument>,
    private startupService: StartupService,
  ) {}

  async sendMessage(
    startupId: string,
    userId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<ChatConversation> {
    try {
      // Get or create conversation
      let conversation = await this.chatConversationModel.findOne({
        startupId: new Types.ObjectId(startupId),
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (!conversation) {
        conversation = await this.chatConversationModel.create({
          startupId: new Types.ObjectId(startupId),
          userId: new Types.ObjectId(userId),
          messages: [],
          isActive: true,
          sessionId: sendMessageDto.sessionId || this.generateSessionId(),
        });
      }

      // Add user message
      const userMessage: ChatMessage = {
        role: MessageRole.USER,
        content: sendMessageDto.message,
      };

      conversation.messages.push(userMessage);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        startupId,
        conversation.messages,
      );

      // Add AI response
      const assistantMessage: ChatMessage = {
        role: MessageRole.ASSISTANT,
        content: aiResponse.message,
      };

      conversation.messages.push(assistantMessage);
      await conversation.save();

      return conversation;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getConversation(
    startupId: string,
    userId: string,
  ): Promise<ChatConversation | null> {
    return this.chatConversationModel.findOne({
      startupId: new Types.ObjectId(startupId),
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
  }

  async clearConversation(startupId: string, userId: string): Promise<void> {
    await this.chatConversationModel.updateOne(
      {
        startupId: new Types.ObjectId(startupId),
        userId: new Types.ObjectId(userId),
        isActive: true,
      },
      { isActive: false },
    );
  }

  private async generateAIResponse(
    startupId: string,
    messages: ChatMessage[],
  ): Promise<{ message: string }> {
    try {
      // Get startup data
      const startupData = await this.startupService.getStartupById(startupId);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are an AI startup advisor with access to comprehensive startup data.

STARTUP DATA:
${JSON.stringify(startupData, null, 2)}

CONVERSATION HISTORY:
${JSON.stringify(messages, null, 2)}

Respond as a helpful startup advisor with access to this startup's specific data.
Provide actionable advice based on the startup's industry, stage, financials, and team.
Keep responses conversational but professional.

Respond with JSON in this exact format:
{
  "message": "Your response to the user"
}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a startup advisor. Always respond with valid JSON exactly matching the provided schema.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content);
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        message:
          "I'm sorry, I'm having trouble processing your request right now. Please try again.",
      };
    }
  }

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
