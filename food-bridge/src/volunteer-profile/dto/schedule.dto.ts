import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleSlotDto {
  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: 'Day of week, where 0 is Sunday and 6 is Saturday.' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm (24h)' })
  startTime: string;

  @ApiProperty({ example: '17:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm (24h)' })
  endTime: string;
}

export class ReplaceScheduleDto {
  @ApiProperty({ type: [ScheduleSlotDto], maxItems: 28, example: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] })
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  slots: ScheduleSlotDto[];
}
