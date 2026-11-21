import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NgoVolunteersService } from './ngo-volunteers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { InviteVolunteerDto } from './dto/invite-volunteer.dto.js';
import { QueryNgoVolunteersDto } from './dto/query-ngo-volunteers.dto.js';

@ApiTags('NGO volunteers')
@ApiBearerAuth('access-token')
@Controller('ngo-volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NgoVolunteersController {
  constructor(private readonly ngoVolunteersService: NgoVolunteersService) {}

  @Post()
  @Roles(UserRole.NGO)
  @ApiOperation({ summary: 'Invite a volunteer to a verified NGO.' })
  invite(@CurrentUser() user: AuthUser, @Body() dto: InviteVolunteerDto) {
    return this.ngoVolunteersService.invite(user.userId, dto);
  }

  @Get()
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List invitations and memberships visible to the caller.' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryNgoVolunteersDto,
  ) {
    return this.ngoVolunteersService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get one volunteer membership.' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.findOne(user, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Accept an NGO invitation and activate the membership.' })
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.accept(user.userId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @Roles(UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'Decline a pending NGO invitation.' })
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.decline(user.userId, id);
  }

  @Delete(':id')
  @Roles(UserRole.NGO, UserRole.VOLUNTEER)
  @ApiOperation({ summary: 'End an invitation or membership without a live assignment.' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ngoVolunteersService.remove(user, id);
  }
}

