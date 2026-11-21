import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InviteVolunteerDto {
  @ApiProperty({ format: 'uuid', example: 'b9a19156-a461-4c5b-a6cf-11393e96d673' })
  @IsUUID()
  volunteerId: string;
}
