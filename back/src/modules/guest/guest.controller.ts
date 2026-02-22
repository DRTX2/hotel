import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { GuestResponseDto } from './dto/guest-response.dto';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@ApiTags('guests')
@Controller('guests')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo huésped' })
  @ApiResponse({ status: 201, description: 'Huésped creado', type: GuestResponseDto })
  create(@Body() createGuestDto: CreateGuestDto): Promise<GuestResponseDto> {
    return this.guestService.create(createGuestDto);
  }

  @Put(':publicId')
  @ApiOperation({ summary: 'Actualizar un huésped' })
  @ApiParam({ name: 'publicId', description: 'ID único del huésped' })
  @ApiResponse({ status: 200, description: 'Huésped actualizado', type: GuestResponseDto })
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string,
    @Body() updateGuestDto: UpdateGuestDto,
  ): Promise<GuestResponseDto> {
    return this.guestService.update(publicId, updateGuestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar huéspedes paginados' })
  @ApiResponse({ status: 200, type: PaginatedResult<GuestResponseDto> })
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResult<GuestResponseDto>> {
    return this.guestService.findAll(paginationDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Obtener un huésped por ID público' })
  @ApiParam({ name: 'publicId', description: 'ID único del huésped' })
  @ApiResponse({ status: 200, type: GuestResponseDto })
  findOne(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<GuestResponseDto> {
    return this.guestService.findOne(publicId);
  }

  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un huésped (Soft Delete)' })
  @ApiParam({ name: 'publicId', description: 'ID único del huésped' })
  @ApiResponse({ status: 204 })
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.guestService.remove(publicId);
  }
}
