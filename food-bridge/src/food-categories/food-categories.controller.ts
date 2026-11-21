import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor.js';
import { UserRole } from '../common/user-role.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { CreateFoodCategoryDto } from './dtos/create-food-category.dto.js';
import { UpdateFoodCategoryDto } from './dtos/update-food-category.dto.js';
import { FoodCategoriesService } from './food-categories.service.js';

@ApiTags('Food categories')
@ApiBearerAuth('access-token')
@Controller('food-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class FoodCategoriesController {
  constructor(private readonly foodCategoriesService: FoodCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a food category as an admin.' })
  createCategory(@Body() dto: CreateFoodCategoryDto) {
    return this.foodCategoriesService.createCategory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List food categories with pagination.' })
  getAllCategories(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.foodCategoriesService.getAllCategories(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a food category by its ID.' })
  getCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodCategoriesService.getCategoryById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rename, activate, or deactivate a food category.' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodCategoryDto,
  ) {
    return this.foodCategoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a food category that no donations use.' })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodCategoriesService.deleteCategory(id);
  }
}

