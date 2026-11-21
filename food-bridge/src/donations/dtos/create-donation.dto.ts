import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DonationUnit } from '../donation-unit.enum.js';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDonationDto {
  @ApiProperty({
    format: 'uuid',
    example: 'f51f07a2-3bb6-4d97-860f-5307a702d4eb',
    description: 'ID of an active food category.',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Vegetable rice', minLength: 3, maxLength: 150 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: '20',
    description:
      'Positive quantity with up to two decimal places. Boxes and meals require a whole number.',
  })
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message:
      'quantity must be a decimal string with at most two decimal places.',
  })
  quantity: string;

  @ApiProperty({ enum: DonationUnit, example: DonationUnit.BOXES })
  @IsEnum(DonationUnit)
  unit: DonationUnit;

  @ApiProperty({ example: 'Gate 2, Sunrise Kitchen' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({ example: 'Dhanmondi', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-11-19T09:00:00.000Z',
    description: 'Start of pickup availability.',
  })
  @IsDateString({ strict: true })
  availableFrom: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-11-19T18:00:00.000Z',
    description: 'Future pickup deadline after availability starts.',
  })
  @IsDateString({ strict: true })
  pickupDeadline: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-11-20T00:00:00.000Z',
    description: 'Use-by time at or after the pickup deadline.',
  })
  @IsDateString({ strict: true })
  declaredUseByAt: string;
}
