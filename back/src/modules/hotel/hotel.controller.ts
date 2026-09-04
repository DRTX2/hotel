import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelResponseDto } from './dto/hotel-response.dto';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@ApiTags('hotels')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo hotel' })
  @ApiResponse({
    status: 201,
    description: 'Hotel creado exitosamente',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: CreateHotelDto })
  create(@Body() createHotelDto: CreateHotelDto): Promise<HotelResponseDto> {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener lista paginada de hoteles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hoteles con metadatos de paginación',
    type: PaginatedResult<HotelResponseDto>,
  })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<HotelResponseDto>> {
    return this.hotelService.findAll(paginationDto);
  }

  @Get('search/city')
  @Public()
  @ApiOperation({ summary: 'Buscar hoteles por ciudad' })
  @ApiQuery({ name: 'city', description: 'Nombre de la ciudad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hoteles en la ciudad especificada',
    type: [HotelResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Parámetro city requerido' })
  findByCity(@Query('city') city: string): Promise<HotelResponseDto[]> {
    return this.hotelService.findByCity(city);
  }

  @Get(':publicId')
  @Public()
  @ApiOperation({ summary: 'Obtener un hotel por ID' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({
    status: 200,
    description: 'Hotel encontrado',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  findOne(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<HotelResponseDto> {
    return this.hotelService.findOne(publicId);
  }

  @Patch(':publicId')
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Actualizar un hotel' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({
    status: 200,
    description: 'Hotel actualizado exitosamente',
    type: HotelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: UpdateHotelDto })
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<HotelResponseDto> {
    return this.hotelService.update(publicId, updateHotelDto);
  }

  @Delete(':publicId')
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un hotel' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({ status: 204, description: 'Hotel eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.hotelService.remove(publicId);
  }
}
