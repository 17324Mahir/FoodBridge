import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, ValidateIf } from 'class-validator';
import { CreateFoodCategoryDto } from './create-food-category.dto.js';

export class UpdateFoodCategoryDto extends PartialType(CreateFoodCategoryDto, {
  skipNullProperties: false,
}) {
  @ApiPropertyOptional({ example: false })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
