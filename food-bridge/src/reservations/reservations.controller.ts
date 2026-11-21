import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { AssignmentsService } from '../assignments/assignments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../common/user-role.enum.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { CancelReservationDto } from './dto/cancel-reservation.dto.js';
import { QueryReservationsDto } from './dto/query-reservations.dto.js';
import { OfferAssignmentDto } from '../assignments/dto/offer-assignment.dto.js';

@ApiTags('Reservations')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
@ApiForbiddenResponse({
  description: 'The user lacks permission for this operation or reservation.',
})
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.NGO)
  @ApiOperation({ summary: 'Reserve an available donation as a verified NGO.' })
  @ApiCreatedResponse({ description: 'The reservation was created.' })
  @ApiBadRequestResponse({
    description: 'The request must include a valid donation UUID.',
  })
  @ApiForbiddenResponse({
    description: 'Only verified NGOs can create reservations.',
  })
  @ApiNotFoundResponse({
    description: 'The donation or NGO profile was not found.',
  })
  @ApiConflictResponse({
    description:
      'The donation is unavailable or its pickup deadline has passed.',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user.userId, dto);
  }

  @Get()
  @Roles(UserRole.NGO, UserRole.DONOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List reservations visible to the authenticated user.',
  })
  @ApiOkResponse({ description: 'Reservations were returned.' })
  @ApiBadRequestResponse({
    description: 'A filter or pagination value is invalid.',
  })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(user, query);
  }

  @Get(':id')
  @Roles(UserRole.NGO, UserRole.DONOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a reservation visible to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Reservation UUID.' })
  @ApiOkResponse({ description: 'The reservation was returned.' })
  @ApiBadRequestResponse({
    description: 'The reservation ID is not a valid UUID.',
  })
  @ApiNotFoundResponse({ description: 'The reservation was not found.' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reservationsService.findOne(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.NGO)
  @ApiOperation({ summary: 'Cancel an eligible reservation.' })
  @ApiParam({ name: 'id', description: 'Reservation UUID.' })
  @ApiOkResponse({ description: 'The reservation was cancelled.' })
  @ApiBadRequestResponse({
    description: 'The reservation ID or cancellation reason is invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The reservation or its donation was not found.',
  })
  @ApiConflictResponse({
    description: 'Only reserved or assigned reservations can be cancelled.',
  })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservationsService.cancel(user.userId, id, dto);
  }

  @Post(':id/assignments')
  @Roles(UserRole.NGO)
  @ApiOperation({
    summary: 'Offer a reservation’s collection assignment to a volunteer.',
  })
  @ApiParam({ name: 'id', description: 'Reservation UUID.' })
  @ApiCreatedResponse({ description: 'The assignment offer was created.' })
  @ApiBadRequestResponse({ description: 'The assignment request is invalid.' })
  @ApiNotFoundResponse({
    description:
      'The reservation, donation, NGO profile, or volunteer membership was not found.',
  })
  @ApiConflictResponse({
    description:
      'The reservation or volunteer is ineligible for an assignment.',
  })
  offerAssignment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OfferAssignmentDto,
  ) {
    return this.assignmentsService.offer(user.userId, id, dto);
  }
}
