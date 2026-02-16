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
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@ApiTags('hotels')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo hotel' })
  @ApiResponse({
    status: 201,
    description: 'Hotel creado exitosamente',
    type: Hotel,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: CreateHotelDto })
  create(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los hoteles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hoteles',
    type: [Hotel],
  })
  findAll(): Promise<Hotel[]> {
    return this.hotelService.findAll();
  }

  @Get('search/city')
  @ApiOperation({ summary: 'Buscar hoteles por ciudad' })
  @ApiQuery({ name: 'city', description: 'Nombre de la ciudad' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hoteles en la ciudad especificada',
    type: [Hotel],
  })
  @ApiResponse({ status: 400, description: 'Parámetro city requerido' })
  findByCity(@Query('city') city: string): Promise<Hotel[]> {
    return this.hotelService.findByCity(city);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Obtener un hotel por ID' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({
    status: 200,
    description: 'Hotel encontrado',
    type: Hotel,
  })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  findOne(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<Hotel> {
    return this.hotelService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Actualizar un hotel' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({
    status: 200,
    description: 'Hotel actualizado exitosamente',
    type: Hotel,
  })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: UpdateHotelDto })
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<Hotel> {
    return this.hotelService.update(publicId, updateHotelDto);
  }

  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un hotel' })
  @ApiParam({ name: 'publicId', description: 'ID único del hotel' })
  @ApiResponse({ status: 204, description: 'Hotel eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.hotelService.remove(publicId);
  }
}
