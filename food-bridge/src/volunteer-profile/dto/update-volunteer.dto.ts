import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateVolunteerProfileDto' })
export class UpdateVolunteerDto {
  @ApiPropertyOptional({ example: 'Updated Volunteer Name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '+8801712345678', maxLength: 20 })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'Dhanmondi, Dhaka', maxLength: 255 })
  address?: string;
}
