import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import {
  EventAttendee,
  EventAttendeeDocument,
} from './schemas/event-attendee.schema';
import { PaginationDto } from './dto/pagination.dto';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventCategoryEnum, EventTypeEnum } from './enums/event.enums';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(EventAttendee.name)
    private eventAttendeeModel: Model<EventAttendeeDocument>,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
    userId: Types.ObjectId,
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
  ) {
    const event = new this.eventModel({
      ...createEventDto,
      createdByUserId: userId,
      // createdByStartupId: startupId || null,
      // createdByInvestorId: investorId || null,
    });

    await event.save();
    return event;
  }

  async getPublicEvent(eventId: string, userId?: Types.ObjectId) {
    const event = await this.eventModel
      .findById(eventId)
      .populate('createdByUserId')
      .populate('createdByStartupId', 'companyName')
      .populate('createdByInvestorId', 'companyName')
      .lean()
      .exec();

    if (!event) throw new NotFoundException('Event not found');

    const attendees = await this.eventAttendeeModel
      .find({ eventId })
      .populate('attendeeStartupId', 'companyName logoFileId')
      .populate('attendeeInvestorId', 'companyName logoFileId')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
      .exec();

    let isJoined = false;

    if (userId) {
      // Check if the user has joined this event
      const joined = await this.eventAttendeeModel
        .findOne({ eventId, userId })
        .lean()
        .exec();
      isJoined = !!joined;
    }

    return {
      ...event,
      isJoined,
      attendeesSnippet: attendees.map((a) => ({
        startup: a.attendeeStartupId || null,
        investor: a.attendeeInvestorId || null,
      })),
    };
  }

  async getUpcomingEvents(
    paginationDto: PaginationDto,
    type?: EventTypeEnum,
    category?: EventCategoryEnum,
    timePeriod?: string,
    isSnippet?: boolean,
    userId?: Types.ObjectId,
  ) {
    const { lastEventId, limit = 50 } = paginationDto;

    // Create a type for MongoDB filter that allows for MongoDB operators
    type MongoFilter = Record<string, any>;

    // Base filter: events that haven't happened yet
    let dateFilter: MongoFilter = { startDate: { $gte: new Date() } };

    // Apply time period filter if specified
    if (timePeriod === 'week') {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      dateFilter = {
        startDate: {
          $gte: new Date(),
          $lte: endOfWeek,
        },
      };
    } else if (timePeriod === 'month') {
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      dateFilter = {
        startDate: {
          $gte: new Date(),
          $lte: endOfMonth,
        },
      };
    }

    // Build the complete filter
    const filter: MongoFilter = { ...dateFilter };

    // Add ID pagination if specified
    if (lastEventId) {
      filter._id = { $gt: new Types.ObjectId(lastEventId) };
    }

    // Add type filter if specified
    if (type) {
      filter.type = type;
    }

    // Add category filter if specified
    if (category) {
      filter.category = category;
    }
    const events = await this.eventModel
      .find(filter)
      .sort({ startDate: 1 })
      .limit(isSnippet ? 4 : limit)
      .populate('createdByUserId')
      .lean()
      .exec();

    if (!userId) {
      // If no user is provided, return events without isJoined property
      return events;
    }

    // Find event IDs that the user has joined
    const joinedEvents = await this.eventAttendeeModel
      .find({ userId })
      .select('eventId')
      .lean()
      .exec();

    const joinedEventIds = new Set(
      joinedEvents.map((e) => e.eventId.toString()),
    );

    // Add `isJoined` field to each event
    return events.map((event) => ({
      ...event,
      isJoined: joinedEventIds.has(event._id.toString()),
    }));
  }
  async getMyEvents(userId: Types.ObjectId) {
    const filter = { createdByUserId: userId };
    return this.eventModel.find(filter).sort({ startDate: 1 }).exec();
  }

  async getJoinedEvents(userId: Types.ObjectId) {
    // First, find all event IDs that the user has joined
    const attendances = await this.eventAttendeeModel
      .find({ userId })
      .select('eventId')
      .lean()
      .exec();

    if (attendances.length === 0) {
      return [];
    }

    // Extract event IDs from attendances
    const eventIds = attendances.map((attendance) => attendance.eventId);

    // Build the filter for finding events
    let filter: any = { _id: { $in: eventIds } };

    const events = await this.eventModel
      .find(filter)
      .lean()
      .populate('createdByUserId');

    return events;

    // Get the events
  }

  async updateEvent(
    eventId: string,
    updateEventDto: UpdateEventDto,
    userId: Types.ObjectId,
  ) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');
    if (event.createdByUserId.toString() !== userId.toString())
      throw new ForbiddenException('Not authorized to update this event');

    // Explicitly apply each field from the DTO to the event
    for (const key in updateEventDto) {
      if (
        updateEventDto.hasOwnProperty(key) &&
        updateEventDto[key] !== undefined
      ) {
        event[key] = updateEventDto[key];
      }
    }

    await event.save();
    return event;
  }

  async deleteEvent(eventId: string, userId: Types.ObjectId) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    if (!event.createdByUserId.equals(userId))
      throw new ForbiddenException('Not authorized to delete this event');

    await this.eventModel.deleteOne({ _id: eventId });
    await this.eventAttendeeModel.deleteMany({ eventId });

    return { message: 'Event deleted successfully' };
  }

  async joinEvent(
    eventId: string,
    userId: Types.ObjectId,
    startupId?: Types.ObjectId,
    investorId?: Types.ObjectId,
  ) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    const alreadyJoined = await this.eventAttendeeModel.findOne({
      eventId: new Types.ObjectId(eventId),
      userId,
    });

    if (!alreadyJoined) {
      await this.eventAttendeeModel.create({
        eventId,
        userId,
        attendeeStartupId: startupId || null,
        attendeeInvestorId: investorId || null,
      });

      await this.eventModel.updateOne(
        { _id: eventId },
        { $inc: { attendeeCount: 1 } },
      );
    }

    return { message: 'Successfully joined event' };
  }
}
