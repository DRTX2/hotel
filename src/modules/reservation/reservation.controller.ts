import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  create(@Body() createReservationDto: CreateReservationDto): Promise<ReservationResponseDto> {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista paginada de reservas' })
  @ApiResponse({ status: 200, type: PaginatedResult<ReservationResponseDto> })
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResult<ReservationResponseDto>> {
    return this.reservationService.findAll(paginationDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  findOne(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<ReservationResponseDto> {
    return this.reservationService.findOne(publicId);
  }

  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una reserva (Soft Delete)' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 204 })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.reservationService.remove(publicId);
  }
}
