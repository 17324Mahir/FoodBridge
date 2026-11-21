import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class OfferAssignmentDto {
  @ApiProperty({
    format: 'uuid',
    example: 'd7ebb795-f171-4f6e-a337-d80004594fa9',
    description: 'ID of the volunteer’s active NGO membership.',
  })
  @IsUUID()
  membershipId: string;

  @ApiPropertyOptional({ example: 'Collect from Gate 2.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
