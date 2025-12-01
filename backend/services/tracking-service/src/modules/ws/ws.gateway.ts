import { JwtPayload } from '@aaron/auth';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { TrackingService } from '../ping/tracking.service';


interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: JwtPayload;
}

@WebSocketGateway({
  namespace: '/ws/track',
  cors: {
    origin: (process.env.WS_ALLOWED_ORIGINS?.split(',') || ['*']) as string[],
    credentials: true,
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsGateway.name);
  private readonly jwtSecret: string;

  // Room management: order:{id}, crew:{id}
  private rooms: Map<string, Set<string>> = new Map(); // room -> Set<socketId>

  constructor(
    private configService: ConfigService,
    private trackingService: TrackingService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 
                     this.configService.get<string>('JWT_ACCESS_SECRET') || '';
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from query or handshake headers
      const token = (client.handshake.query.token as string) || 
                   client.handshake.auth?.token ||
                   client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`WebSocket connection rejected: no token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`WebSocket connection rejected: invalid token`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = payload.userId || payload.sub;
      client.user = payload;

      this.logger.log(`WebSocket connected: userId=${client.userId}`);

      // Send confirmation
      client.emit('connected', {
        message: 'WebSocket connection established',
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error('WebSocket connection error', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`WebSocket disconnected: userId=${client.userId || 'unknown'}`);

    // Remove from all rooms
    this.rooms.forEach((sockets, room) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.rooms.delete(room);
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): void {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { room } = data;

    // Validate room format: order:{id} or crew:{id}
    if (!room.match(/^(order|crew):[a-zA-Z0-9-]+$/)) {
      client.emit('error', { message: 'Invalid room format. Use order:{id} or crew:{id}' });
      return;
    }

    client.join(room);

    // Track room membership
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(client.id);

    this.logger.log(`Client ${client.userId} subscribed to room ${room}`);

    client.emit('subscribed', {
      room,
      success: true,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): void {
    const { room } = data;

    client.leave(room);

    // Remove from room tracking
    const sockets = this.rooms.get(room);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.rooms.delete(room);
      }
    }

    client.emit('unsubscribed', {
      room,
      success: true,
    });
  }

  @SubscribeMessage('location_update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { crewId: string; orderId?: string; lat: number; lng: number },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const { crewId, orderId, lat, lng } = data;

      if (!crewId || !orderId) {
        client.emit('error', { message: 'Missing crewId or orderId for location update' });
        return;
      }

      // Validate coordinates
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        client.emit('error', { message: 'Invalid coordinates' });
        return;
      }

      // Save ping to database
      const result = await this.trackingService.savePing({
        crewId,
        orderId,
        lat,
        lng,
        source: 'realtime',
      });

      if (result._tag === 'error') {
        this.logger.error('Failed to save ping', result.error);
        client.emit('error', { message: 'Failed to save location' });
        return;
      }

      // Broadcast to rooms
      const rooms: string[] = [];
      if (orderId) rooms.push(`order:${orderId}`);
      if (crewId) rooms.push(`crew:${crewId}`);

      rooms.forEach((room) => {
        this.server.to(room).emit('location_update', {
          crewId,
          orderId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });
      });

      // Confirm receipt
      client.emit('location_saved', {
        success: true,
        pingId: result.value.id,
      });
    } catch (error) {
      this.logger.error('Error handling location_update', error);
      client.emit('error', { message: 'Failed to process location update' });
    }
  }

  /**
   * Broadcast message to a room (called by EventsModule)
   */
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.log(`Broadcasted ${event} to room ${room}`);
  }

  /**
   * Join clients to a room when ORDER_EN_CAMINO event is received
   */
  suggestRoom(room: string) {
    // Room is already available; clients can subscribe
    // This method is called by EventsModule to track the room
    this.logger.log(`Room ${room} is now available for subscription`);
  }

  private verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      const userId = decoded.userId || decoded.sub;
      if (!userId) {
        return null;
      }

      return {
        ...decoded,
        userId,
        sub: userId,
      };
    } catch (error) {
      return null;
    }
  }
}
