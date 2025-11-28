import { Controller, Get } from '@nestjs/common';

/**
 * Health Controller
 * Endpoints de health check del gateway (liveness/readiness)
 */
@Controller('health')
export class HealthController {
  @Get()
  liveness() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  readiness() {
    // Basic readiness check - gateway is ready to accept requests
    // TODO: Optional - check downstream services health
    return {
      status: 'ok',
      service: 'api-gateway',
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }
}

