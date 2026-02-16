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
import { HotelService } from './hotel.service';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  create(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  findAll(): Promise<Hotel[]> {
    return this.hotelService.findAll();
  }

  @Get('search/city')
  findByCity(@Query('city') city: string): Promise<Hotel[]> {
    return this.hotelService.findByCity(city);
  }

  @Get('publicId')
  findOne(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<Hotel> {
    return this.hotelService.findOne(publicId);
  }

  @Patch(':publicId')
  update(
    @Param('publicId', ParseUUIDPipe) publicId: string   ,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<Hotel> {
    return this.hotelService.update(publicId, updateHotelDto);
  }

  @Delete(':publicId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('publicId', ParseUUIDPipe) publicId: string): Promise<void> {
    return this.hotelService.remove(publicId);
  }
}
