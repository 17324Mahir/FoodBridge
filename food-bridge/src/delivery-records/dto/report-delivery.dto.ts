import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ReportDeliveryDto {
  @ApiProperty({ example: '20', description: 'Delivered quantity as a decimal string.' })
  @Matches(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, {
    message: 'deliveredQuantity must be a positive decimal with at most 2 places',
  })
  deliveredQuantity: string;

  @ApiProperty({ example: 'Dhanmondi Community Center', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipientName: string;
}
