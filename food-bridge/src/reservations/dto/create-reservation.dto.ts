import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    format: 'uuid',
    example: '226c9140-df83-4301-8752-507fdec7a9fd',
    description: 'Donation to reserve.',
  })
  @IsUUID()
  donationId: string;
}
