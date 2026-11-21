import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { NgoReportsService } from './ngo-reports.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';

@ApiTags('NGO reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NgoReportsController {
  constructor(private readonly ngoReportsService: NgoReportsService) {}

  @Get('ngo')
  @Roles(UserRole.NGO)
  @ApiOperation({ summary: 'Summarize the signed-in NGO’s reservations, volunteers, assignments, and deliveries.' })
  getReport(@CurrentUser() user: AuthUser) {
    return this.ngoReportsService.getReport(user.userId);
  }
}

