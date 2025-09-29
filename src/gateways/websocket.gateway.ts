import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins, configure this based on your needs
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Map to store user connections
  private users = new Map<string, Socket>();

  // Handle new connections
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string; // Extract userId from the connection query params
    if (userId) {
      this.users.set(userId, client); // Store the user's socket connection
      console.log(`User ${userId} connected.`);
    }
  }

  // Handle disconnections
  handleDisconnect(client: Socket) {
    const userId = [...this.users.entries()].find(
      ([, socket]) => socket === client,
    )?.[0]; // Find the userId for this connection
    if (userId) {
      this.users.delete(userId); // Remove the user from the map
      console.log(`User ${userId} disconnected.`);
    }
  }

  // Listen for messages from clients
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): void {
    console.log(`Message from user: ${payload.userId} - ${payload.message}`);
  }

  // Global method to send message to a specific user by userId
  sendMessageToUser(userId: string, message: string): void {
    const userSocket = this.users.get(userId);
    if (userSocket) {
      userSocket.emit('message', { message });
    } else {
      console.log(`User ${userId} is not connected.`);
    }
  }
}
