import { IsEnum } from 'class-validator';
import { AvailabilityStatus } from '../../common/availability-status.enum.js';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: AvailabilityStatus, example: AvailabilityStatus.AVAILABLE })
  @IsEnum(AvailabilityStatus)
  availability: AvailabilityStatus;
}
