import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../donor-catalogue-auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { DonationsService } from './donations.service.js';
import { CreateDonationDto } from './dtos/create-donation.dto.js';
import { DonationQueryDto } from './dtos/donation-query.dto.js';
import { UpdateDonationDto } from './dtos/update-donation.dto.js';

type AuthenticatedRequest = { user: AuthenticatedUser };

@ApiTags('Donations')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'A valid bearer token is required.' })
@ApiForbiddenResponse({
  description: 'An approved donor organization is required.',
})
@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Roles(UserRole.DONOR)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a donation draft.' })
  @ApiCreatedResponse({ description: 'The donation draft was created.' })
  @ApiBadRequestResponse({ description: 'The donation details are invalid.' })
  @ApiNotFoundResponse({ description: 'The food category was not found.' })
  @ApiConflictResponse({ description: 'The food category is inactive.' })
  createDraft(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDonationDto,
  ) {
    return this.donationsService.createDraft(request.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List donations belonging to the donor’s organization.' })
  @ApiOkResponse({ description: 'The organization’s donations were returned.' })
  @ApiBadRequestResponse({
    description: 'A filter or pagination value is invalid.',
  })
  getDonations(
    @Req() request: AuthenticatedRequest,
    @Query() query: DonationQueryDto,
  ) {
    return this.donationsService.getDonations(request.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one donation owned by the authenticated donor’s organization.',
  })
  @ApiParam({ name: 'id', description: 'Donation UUID.' })
  @ApiOkResponse({ description: 'The donation was returned.' })
  @ApiBadRequestResponse({
    description: 'The donation ID is not a valid UUID.',
  })
  @ApiNotFoundResponse({
    description: 'The donation was not found for this organization.',
  })
  getDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.getDonation(request.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft or available donation.' })
  @ApiParam({ name: 'id', description: 'Donation UUID.' })
  @ApiOkResponse({ description: 'The donation was updated.' })
  @ApiBadRequestResponse({
    description: 'The donation ID or update details are invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The donation or selected food category was not found.',
  })
  @ApiConflictResponse({
    description:
      'The donation status, an active reservation, or an inactive category prevents the update.',
  })
  updateDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonationDto,
  ) {
    return this.donationsService.updateDonation(request.user.userId, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish an eligible donation.' })
  @ApiParam({ name: 'id', description: 'Donation UUID.' })
  @ApiOkResponse({ description: 'The donation was published.' })
  @ApiBadRequestResponse({
    description: 'The donation ID, quantity, or pickup dates are invalid.',
  })
  @ApiNotFoundResponse({
    description: 'The donation or its food category was not found.',
  })
  @ApiConflictResponse({
    description:
      'Publishing requires a draft, an active category, and no active reservations.',
  })
  publishDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.publishDonation(request.user.userId, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an eligible donation.' })
  @ApiParam({ name: 'id', description: 'Donation UUID.' })
  @ApiOkResponse({ description: 'The donation was withdrawn.' })
  @ApiBadRequestResponse({ description: 'The donation ID is invalid.' })
  @ApiConflictResponse({
    description:
      'Withdrawal requires an available donation with no active reservation.',
  })
  @ApiNotFoundResponse({
    description: 'The donation was not found for this organization.',
  })
  withdrawDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.withdrawDonation(request.user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a donation.' })
  @ApiParam({ name: 'id', description: 'Donation UUID.' })
  @ApiNoContentResponse({ description: 'The donation was archived.' })
  @ApiBadRequestResponse({ description: 'The donation ID is invalid.' })
  @ApiConflictResponse({
    description:
      'Archiving requires a draft or available donation with no reservation history.',
  })
  @ApiNotFoundResponse({
    description: 'The donation was not found for this organization.',
  })
  archiveDonation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.donationsService.archiveDonation(request.user.userId, id);
  }
}
