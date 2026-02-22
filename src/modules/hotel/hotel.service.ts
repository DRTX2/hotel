import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelResponseDto } from './dto/hotel-response.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<HotelResponseDto> {
      const hotel = this.hotelRepository.create(createHotelDto);
      const savedHotel = await this.hotelRepository.save(hotel);
      this.logger.log(`Hotel creado: ${savedHotel.publicId}`);
      return plainToInstance(HotelResponseDto, savedHotel, {
        excludeExtraneousValues: true,
      });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<HotelResponseDto>> {
    this.logger.log(
      `Obteniendo hoteles: página ${paginationDto.page}, límite ${paginationDto.limit}`,
    );

    const queryBuilder = this.hotelRepository
      .createQueryBuilder('hotel')
      .orderBy('hotel.createdAt', 'DESC');

    const { data, meta } = await this.paginationService.paginate(
      queryBuilder,
      paginationDto,
    );

    const hotelsDto = data.map((hotel) =>
      plainToInstance(HotelResponseDto, hotel, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: hotelsDto,
      meta,
    };
  }

  async findOne(publicId: string): Promise<HotelResponseDto> {
    const hotel = await this.findOneEntity(publicId);
    return plainToInstance(HotelResponseDto, hotel, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Uso interno para otros servicios que necesiten la entidad real con sus relaciones
   */
  async findOneEntity(publicId: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({ where: { publicId } });
    if (!hotel) {
      this.logger.warn(`Hotel no encontrado: ${publicId}`);
      throw new NotFoundException(`Hotel con ID ${publicId} no encontrado`);
    }
    return hotel;
  }

  async findByCity(city: string): Promise<HotelResponseDto[]> {
    this.logger.log(`Buscando hoteles en: ${city}`);
    const hotels = await this.hotelRepository.find({
      where: { city },
      order: { rating: 'DESC' },
    });
    return hotels.map((hotel) =>
      plainToInstance(HotelResponseDto, hotel, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async update(
    publicId: string,
    updateHotelDto: UpdateHotelDto,
  ): Promise<HotelResponseDto> {
    const hotel = await this.hotelRepository.findOne({ where: { publicId } });
    if (!hotel) {
      this.logger.warn(`Hotel no encontrado: ${publicId}`);
      throw new NotFoundException(`Hotel con ID ${publicId} no encontrado`);
    }

    Object.assign(hotel, updateHotelDto);
    const updatedHotel = await this.hotelRepository.save(hotel);
    this.logger.log(`Hotel actualizado: ${publicId}`);
    return plainToInstance(HotelResponseDto, updatedHotel, {
      excludeExtraneousValues: true,
    });
  }

  async remove(publicId: string): Promise<void> {
    const hotel = await this.hotelRepository.findOne({ where: { publicId } });
    if (!hotel) {
      this.logger.warn(`Hotel no encontrado: ${publicId}`);
      throw new NotFoundException(`Hotel con ID ${publicId} no encontrado`);
    }
    await this.hotelRepository.softRemove(hotel);
    this.logger.log(`Hotel eliminado (soft): ${publicId}`);
  }
}
