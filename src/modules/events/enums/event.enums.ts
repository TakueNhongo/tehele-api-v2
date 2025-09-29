export enum EventTypeEnum {
  VIRTUAL = 'Virtual',
  HYBRID = 'Hybrid',
  IN_PERSON = 'In-Person',
}

export enum EventCategoryEnum {
  CONFERENCE = 'Conference',
  PITCH_EVENT = 'Pitch Event',
  NETWORKING = 'Networking',
  WORKSHOP = 'Workshop',
  DEMO_DAY = 'Demo Day',
  HACKATHON = 'Hackathon',
  WEBINAR = 'Webinar',
  ROUNDTABLE = 'Roundtable',
  FIRESIDE_CHAT = 'Fireside Chat',
  PANEL_DISCUSSION = 'Panel Discussion',
  FUNDRAISING = 'Fundraising',
  PRODUCT_LAUNCH = 'Product Launch',
  MENTORSHIP = 'Mentorship',
  BOOTCAMP = 'Bootcamp',
  AWARDS = 'Awards',
  EXHIBITION = 'Exhibition',
  OTHER = 'Other',
}

export interface EventFilters {
  lastEventId?: string;
  limit?: number;
  type?: EventTypeEnum;
  category?: EventCategoryEnum;
  timePeriod?: 'week' | 'month';
}
