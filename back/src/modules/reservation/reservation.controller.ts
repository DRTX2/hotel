import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { CancelReservationResponseDto } from './dto/cancel-reservation-response.dto';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Rango inválido o capacidad excedida',
  })
  @ApiResponse({
    status: 409,
    description: 'Habitación ya reservada en esas fechas',
  })
  create(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista paginada de reservas' })
  @ApiResponse({ status: 200, type: PaginatedResult<ReservationResponseDto> })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    return this.reservationService.findAll(paginationDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  findOne(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<ReservationResponseDto> {
    return this.reservationService.findOne(publicId);
  }

  @Patch(':publicId')
  @Roles(UserRole.STAFF)
  @ApiOperation({
    summary: 'Cambiar fechas o nº de huéspedes (recalcula precio)',
  })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 409, description: 'Nuevo rango solapado' })
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationService.update(publicId, updateReservationDto);
  }

  @Post(':publicId/check-in')
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check-in: marca la reserva como pagada y ocupa la habitación',
  })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  checkIn(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<ReservationResponseDto> {
    return this.reservationService.checkIn(publicId);
  }

  @Post(':publicId/check-out')
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-out: libera la habitación' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  checkOut(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<ReservationResponseDto> {
    return this.reservationService.checkOut(publicId);
  }

  @Post(':publicId/cancel')
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar reserva aplicando política de reembolso' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 200, type: CancelReservationResponseDto })
  cancel(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<CancelReservationResponseDto> {
    return this.reservationService.cancel(publicId);
  }

  @Delete(':publicId')
  @Roles(UserRole.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una reserva (Soft Delete)' })
  @ApiParam({ name: 'publicId', description: 'ID público de la reserva' })
  @ApiResponse({ status: 204 })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.reservationService.remove(publicId);
  }
}
