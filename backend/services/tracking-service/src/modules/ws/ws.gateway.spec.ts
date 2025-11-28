import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { TrackingService } from '../ping/tracking.service';

import { WsGateway } from './ws.gateway';

describe('WsGateway', () => {
  let gateway: WsGateway;
  let trackingService: TrackingService;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsGateway,
        {
          provide: TrackingService,
          useValue: {
            savePing: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET' || key === 'JWT_ACCESS_SECRET') {
                return 'test-secret';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    gateway = module.get<WsGateway>(WsGateway);
    trackingService = module.get<TrackingService>(TrackingService);

    // Mock Socket.IO server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = mockServer as any;

    // Mock socket
    mockSocket = {
      id: 'test-socket-id',
      userId: 'test-user-id',
      user: { userId: 'test-user-id' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleSubscribe', () => {
    it('should subscribe client to valid room', () => {
      const data = { room: 'order:test-order-id' };
      gateway.handleSubscribe(mockSocket, { room: data.room });

      expect(mockSocket.join).toHaveBeenCalledWith('order:test-order-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
        room: 'order:test-order-id',
        success: true,
      });
    });

    it('should reject invalid room format', () => {
      const data = { room: 'invalid-room' };
      gateway.handleSubscribe(mockSocket, { room: data.room });

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid room format. Use order:{id} or crew:{id}',
      });
    });
  });

  describe('broadcastToRoom', () => {
    it('should broadcast message to room', () => {
      const room = 'order:test-order-id';
      const event = 'test_event';
      const data = { test: 'data' };

      gateway.broadcastToRoom(room, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(room);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });
});

