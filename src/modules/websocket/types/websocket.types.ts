export enum RecipientType {
  WS_PLATFORM_SINGLE_RECIPIENT = 'WS_PLATFORM_SINGLE_RECIPIENT',
  WS_PLATFORM_ALL_USER_CONNECTIONS = 'WS_PLATFORM_ALL_USER_CONNECTIONS',
  WS_PLATFORM_MULTIPLE_TENANTS = 'WS_PLATFORM_MULTIPLE_TENANTS',
  WS_FUNCTION_CALL_SUBSCRIBER = 'WS_FUNCTION_CALL_SUBSCRIBER',
  WS_FUNCTION_CALL_RESPONSE = 'WS_FUNCTION_CALL_RESPONSE',
}

export interface WSSendPlatformSingleUserConnection {
  userId: string;
  connectionId: string;
  message: any;
}

export interface WSSendFunctionCallData {
  wsFunctionCallSubscriber: string;
  payload: {
    function: string;
    arguments: Record<string, unknown>;
    qflitSession: {
      runId: string;
      threadId: string;
      assistantKey: string;
      projectId: string;
      toolCallId: string;
      customParameters?: Record<string, unknown>;
    };
    event: 'function_call';
  };
}

export interface WSSendPlatformMultipleUserConnections {
  userId: string;
  message: any;
}

export interface WSSendTenantMultipleConnections {
  projectId: string;
  subscriptionIds: string[];
  assistantKey: string;
  message: any;
}

export interface WSFunctionResponseData {
  event: 'function_result';
  function: string; // The name of the function being called
  runId: string;
  assistantKey: string;
  toolCallId: string;
  result: string | Record<string, unknown>; // The response from the client, can be a string or an object
}

export type RecipientData =
  | {
      type: RecipientType.WS_PLATFORM_SINGLE_RECIPIENT;
      data: WSSendPlatformSingleUserConnection;
    }
  | {
      type: RecipientType.WS_PLATFORM_ALL_USER_CONNECTIONS;
      data: WSSendPlatformMultipleUserConnections;
    }
  | {
      type: RecipientType.WS_PLATFORM_MULTIPLE_TENANTS;
      data: WSSendTenantMultipleConnections;
    }
  | {
      type: RecipientType.WS_FUNCTION_CALL_SUBSCRIBER; // New case for function call subscribers
      data: WSSendFunctionCallData;
    }
  | {
      type: RecipientType.WS_FUNCTION_CALL_RESPONSE; // New case for function call subscribers
      data: WSFunctionResponseData;
    };
