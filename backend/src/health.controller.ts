import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      service: 'cracoe-connect-signaling',
      timestamp: new Date().toISOString(),
    };
  }
}
