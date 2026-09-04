import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness: el proceso responde' })
  @ApiResponse({ status: 200, description: 'API viva' })
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HttpCode(200)
  @ApiOperation({ summary: 'Readiness: dependencias (DB) disponibles' })
  @ApiResponse({ status: 200, description: 'API lista' })
  @ApiResponse({ status: 503, description: 'Dependencia caída' })
  async ready(): Promise<{
    status: string;
    checks: { database: string };
  }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', checks: { database: 'up' } };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database: 'down' },
      });
    }
  }
}
