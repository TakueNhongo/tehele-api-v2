import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import {
  EventAttendee,
  EventAttendeeSchema,
} from './schemas/event-attendee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventAttendee.name, schema: EventAttendeeSchema },
    ]),
  ],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
