export enum ConnectionStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum ConnectionInitiatorTypeEnum {
  INVESTOR = 'investor',
  STARTUP = 'startup',
}

export enum ConnectionInitiationMethodEnum {
  DIRECT_REQUEST = 'direct_request',

  LIKE_INITIATED = 'like_initiated',
  DIRECT_MESSAGE = 'direct_message',
}
