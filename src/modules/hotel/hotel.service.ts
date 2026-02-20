import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelResponseDto } from './dto/hotel-response.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<HotelResponseDto> {
    try {
      const hotel = this.hotelRepository.create(createHotelDto);
      const savedHotel = await this.hotelRepository.save(hotel);
      this.logger.log(`Hotel creado: ${savedHotel.publicId}`);
      return plainToInstance(HotelResponseDto, savedHotel, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(`Error al crear hotel: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<HotelResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    this.logger.log(`Obteniendo hoteles: página ${page}, límite ${limit}`);

    const [hotels, total] = await this.hotelRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = hotels.map((hotel) =>
      plainToInstance(HotelResponseDto, hotel, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
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
