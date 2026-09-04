import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Crear una nueva habitación para un hotel' })
  @ApiResponse({
    status: 201,
    description: 'Habitación creada',
    type: RoomResponseDto,
  })
  create(@Body() createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener lista de todas las habitaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada',
    type: PaginatedResult<RoomResponseDto>,
  })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RoomResponseDto>> {
    return this.roomService.findAll(paginationDto);
  }

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Habitaciones disponibles para un rango de fechas' })
  @ApiResponse({ status: 200, type: PaginatedResult<RoomResponseDto> })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido' })
  findAvailable(
    @Query() query: AvailabilityQueryDto,
  ): Promise<PaginatedResult<RoomResponseDto>> {
    return this.roomService.findAvailable(query);
  }

  @Get(':publicId')
  @Public()
  @ApiOperation({ summary: 'Obtener habitación por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID único de la habitación' })
  findOne(
    @Param('publicId', ParseUUIDPipe) publicId: string,
  ): Promise<RoomResponseDto | null> {
    return this.roomService.findOne(publicId);
  }

  @Patch(':publicId')
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Actualizar una habitación' })
  @ApiParam({ name: 'publicId', description: 'ID único de la habitación' })
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto | null> {
    return this.roomService.update(publicId, updateRoomDto);
  }

  @Delete(':publicId')
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Eliminar una habitación' })
  @ApiParam({ name: 'publicId', description: 'ID único de la habitación' })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string) {
    return this.roomService.remove(publicId);
  }
}
