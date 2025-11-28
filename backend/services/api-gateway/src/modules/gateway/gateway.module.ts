import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { json } from 'express';

import { ProxyMiddleware } from '../../common/middlewares/proxy.middleware';

/**
 * GatewayModule
 * Maneja el reverse proxy a servicios backend
 * Aplica JWT guard global antes de enrutar
 */
@Module({})
export class GatewayModule {
  configure(consumer: MiddlewareConsumer) {
    console.log('[GatewayModule] Configuring middleware...');
    
    // Apply proxy middleware
    consumer
      .apply(ProxyMiddleware)
      .forRoutes(
        { path: '*', method: RequestMethod.ALL },
      );
  }
}

