import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventFilterDto, PaginationDto } from './dto/pagination.dto';
import { RequestWithUser } from 'src/types/requests.type';
import { Public } from 'src/decorators/public.decorator';
import { EventCategoryEnum, EventTypeEnum } from './enums/event.enums';
import { InternalServerError } from 'openai';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req: RequestWithUser,
  ) {
    return this.eventsService.createEvent(
      createEventDto,
      req.user._id,
      req.profileType === 'startup' ? req.profileId : null,
      req.profileType === 'investor' ? req.profileId : null,
    );
  }

  @Get('upcoming')
  @ApiOperation({
    summary:
      'Get upcoming events (filtered by type, category, and time period)',
  })
  async getUpcomingEvents(
    @Query() paginationDto: EventFilterDto,
    @Req() req: RequestWithUser,
    @Query('type') type?: EventTypeEnum,
    @Query('isSnippet') isSnippet?: boolean,
    @Query('category') category?: EventCategoryEnum,
    @Query('timePeriod') timePeriod?: string, // 'week', 'month', or undefined for all
  ) {
    console.log(paginationDto);
    return this.eventsService.getUpcomingEvents(
      paginationDto,
      type,
      category,
      timePeriod,
      isSnippet,
      req.user._id,
    );
  }

  @Get('my-events')
  @ApiOperation({ summary: 'Get events created by the current user' })
  async getMyEvents(@Req() req: RequestWithUser) {
    return this.eventsService.getMyEvents(req.user._id);
  }

  @Get('joined')
  @ApiOperation({ summary: 'Get events joined by the current user' })
  async getJoinedEvents(@Req() req: RequestWithUser) {
    return this.eventsService.getJoinedEvents(req.user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public event details' })
  async getPublicEvent(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.getPublicEvent(id, req.user._id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event (Owner only)' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: RequestWithUser,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto, req.user._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event (Owner only)' })
  async deleteEvent(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.deleteEvent(id, req.user._id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join an event' })
  async joinEvent(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.joinEvent(
      id,
      req.user._id,
      req.profileType === 'startup' ? req.profileId : null,
      req.profileType === 'investor' ? req.profileId : null,
    );
  }
}
