import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { VolunteerProfileService } from './volunteer-profile.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import { ReplaceScheduleDto } from './dto/schedule.dto.js';
import { QueryAvailableDto, QueryVolunteersDto } from './dto/query-volunteers.dto.js';

@ApiTags('Volunteers')
@ApiBearerAuth('access-token')
@Controller('volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteerProfileController {
    constructor(private readonly service: VolunteerProfileService) {}

    // ----- volunteer (self) — keep these BEFORE the ':id' routes -----

    @Get('me')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get the authenticated volunteer profile.' })
    @ApiOkResponse({ description: 'The volunteer profile was returned.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    getMe(@CurrentUser() user: AuthUser) {
        return this.service.findMe(user.userId);
    }

    @Patch('me')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Update the authenticated volunteer profile.' })
    @ApiOkResponse({ description: 'The volunteer profile was updated.' })
    @ApiBadRequestResponse({ description: 'The profile details are invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateVolunteerDto) {
        return this.service.update(user.userId, dto);
    }

    @Delete('me')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Remove the authenticated volunteer profile.' })
    @ApiOkResponse({ description: 'The volunteer profile was removed.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    deleteMe(@CurrentUser() user: AuthUser) {
        return this.service.remove(user.userId);
    }

    @Patch('me/availability')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Change the authenticated volunteer’s availability.' })
    @ApiOkResponse({ description: 'Availability was updated.' })
    @ApiBadRequestResponse({ description: 'The availability value is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    setAvailability(@CurrentUser() user: AuthUser, @Body() dto: UpdateAvailabilityDto) {
        return this.service.setAvailability(user.userId, dto.availability);
    }

    @Get('me/schedule')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get the authenticated volunteer’s weekly schedule.' })
    @ApiOkResponse({ description: 'The weekly schedule was returned.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    getMySchedule(@CurrentUser() user: AuthUser) {
        return this.service.getSchedule(user.userId);
    }

    @Put('me/schedule')
    @Roles(UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Replace the authenticated volunteer’s weekly schedule.' })
    @ApiOkResponse({ description: 'The weekly schedule was replaced.' })
    @ApiBadRequestResponse({ description: 'One or more schedule slots are invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only volunteers can use this endpoint.' })
    replaceMySchedule(@CurrentUser() user: AuthUser, @Body() dto: ReplaceScheduleDto) {
        return this.service.replaceSchedule(user.userId, dto);
    }

    // ----- NGO / admin -----

    @Get('available')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    @ApiOperation({ summary: 'Find available volunteers by day and optional time.' })
    @ApiOkResponse({ description: 'Matching volunteers were returned.' })
    @ApiBadRequestResponse({ description: 'The day or time filter is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only NGOs and admins can search volunteers.' })
    findAvailable(@Query() query: QueryAvailableDto) {
        return this.service.findAvailable(query);
    }

    @Get()
    @Roles(UserRole.NGO, UserRole.ADMIN)
    @ApiOperation({ summary: 'List volunteer profiles.' })
    @ApiOkResponse({ description: 'Volunteer profiles were returned.' })
    @ApiBadRequestResponse({ description: 'A filter or pagination value is invalid.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only NGOs and admins can list volunteers.' })
    findAll(@Query() query: QueryVolunteersDto) {
        return this.service.findAll(query);
    }

    @Get(':id')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get one volunteer profile.' })
    @ApiParam({ name: 'id', description: 'Volunteer user UUID.' })
    @ApiOkResponse({ description: 'The volunteer profile was returned.' })
    @ApiBadRequestResponse({ description: 'The volunteer ID is not a valid UUID.' })
    @ApiNotFoundResponse({ description: 'The volunteer profile was not found.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only NGOs and admins can view this profile.' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.findOne(id);
    }

    @Get(':id/schedule')
    @Roles(UserRole.NGO, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get a volunteer’s weekly schedule.' })
    @ApiParam({ name: 'id', description: 'Volunteer user UUID.' })
    @ApiOkResponse({ description: 'The weekly schedule was returned.' })
    @ApiBadRequestResponse({ description: 'The volunteer ID is not a valid UUID.' })
    @ApiNotFoundResponse({ description: 'The volunteer profile was not found.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only NGOs and admins can view schedules.' })
    getSchedule(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.getSchedule(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Remove a volunteer profile.' })
    @ApiParam({ name: 'id', description: 'Volunteer user UUID.' })
    @ApiOkResponse({ description: 'The volunteer profile was removed.' })
    @ApiBadRequestResponse({ description: 'The volunteer ID is not a valid UUID.' })
    @ApiNotFoundResponse({ description: 'The volunteer profile was not found.' })
    @ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
    @ApiForbiddenResponse({ description: 'Only admins can remove volunteer profiles.' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}

