import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators';

export function createHealthController(serviceName: string) {
  @ApiTags('Health')
  @Controller('health')
  class HealthController {
    @Public()
    @Get()
    @ApiOperation({ summary: `بررسی وضعیت سلامت سرویس ${serviceName}` })
    check() {
      return {
        status: 'ok',
        service: serviceName,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return HealthController;
}
