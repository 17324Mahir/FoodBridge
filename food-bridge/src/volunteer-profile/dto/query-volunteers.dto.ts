import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AvailabilityStatus } from '../../common/availability-status.enum.js';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class QueryVolunteersDto {
  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
  limit: number = 10;
}

export class QueryAvailableDto {
  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: 'Day of week, where 0 is Sunday and 6 is Saturday.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day: number;

  /** HH:mm */
  @ApiPropertyOptional({ example: '09:30', description: 'Filter by a time in 24-hour HH:mm format.' })
  @IsOptional()
  time?: string;
}
