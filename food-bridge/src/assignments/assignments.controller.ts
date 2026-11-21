import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { QueryAssignmentsDto } from './dto/query-assignments.dto.js';

@ApiTags('Assignments')
@ApiBearerAuth('access-token')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List collection assignments visible to the caller.' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryAssignmentsDto) {
    return this.assignmentsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get one collection assignment and its reservation status.' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.findOne(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  @ApiOperation({ summary: 'Cancel a collection assignment before pickup.' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.cancel(user.userId, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Accept a collection assignment and assign the reservation.' })
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.accept(user.userId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Decline an open collection assignment.' })
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.decline(user.userId, id);
  }

  @Post(':id/pickup')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Record food pickup for an accepted assignment.' })
  recordPickup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.recordPickup(user.userId, id);
  }
}

