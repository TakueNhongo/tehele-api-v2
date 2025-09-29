import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

interface ProfileConnection {
  socket: WebSocket;
  connectionId: string;
}

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private wss: WebSocket.Server;
  // Map of profileId to Map of connectionIds and their sockets
  private profileConnections: Map<string, Map<string, ProfileConnection>> =
    new Map();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onModuleInit() {
    this.wss = new WebSocket.Server({ noServer: true });
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();

    server.on('upgrade', async (request, socket, head) => {
      const params = this.extractParams(request.url);

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });
  }

  onModuleDestroy() {
    this.wss.clients.forEach((ws) => ws.close());
    this.wss.close();
  }

  private extractParams(url: string) {
    const urlObject = new URL(url, 'http://localhost');
    const params = new URLSearchParams(urlObject.search);

    return {
      profileId: params.get('profileId'),
      connectionId: params.get('connectionId'),
    };
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const { profileId, connectionId } = this.extractParams(request.url);

    // Initialize map for this profile if it doesn't exist
    if (!this.profileConnections.has(profileId)) {
      this.profileConnections.set(profileId, new Map());
    }

    // Add this connection
    this.profileConnections.get(profileId).set(connectionId, {
      socket: ws,
      connectionId,
    });

    // Handle disconnect
    ws.on('close', () => {
      const connections = this.profileConnections.get(profileId);
      if (connections) {
        connections.delete(connectionId);
        if (connections.size === 0) {
          this.profileConnections.delete(profileId);
        }
      }
    });
  }

  // Send refetch command to all connections of a specific profile
  public sendRefetchCommand(profileId: string): void {
    try {
      const connections = this.profileConnections.get(profileId);

      if (connections) {
        connections.forEach(({ socket }) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'REFETCH_COMMAND',
                timestamp: new Date().toISOString(),
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error('Error sending refetch command:', error);
    }
  }

  // Get number of active connections for a profile
  public getProfileConnectionCount(profileId: string): number {
    return this.profileConnections.get(profileId)?.size || 0;
  }
}
