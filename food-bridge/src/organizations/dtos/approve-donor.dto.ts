import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveDonorDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Existing donor organization to approve and assign.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
