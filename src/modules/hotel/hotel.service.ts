import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    try {
      const hotel = this.hotelRepository.create(createHotelDto);
      const savedHotel = await this.hotelRepository.save(hotel);
      this.logger.log(`Hotel creado: ${savedHotel.publicId}`);
      return savedHotel;
    } catch (error) {
      this.logger.error(`Error al crear hotel: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Hotel[]> {
    this.logger.log('Obteniendo todos los hoteles');
    return this.hotelRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(publicId: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({ where: { publicId } });
    if (!hotel) {
      this.logger.warn(`Hotel no encontrado: ${publicId}`);
      throw new NotFoundException(`Hotel con ID ${publicId} no encontrado`);
    }
    return hotel;
  }

  async findByCity(city: string): Promise<Hotel[]> {
    this.logger.log(`Buscando hoteles en: ${city}`);
    return this.hotelRepository.find({
      where: { city },
      order: { rating: 'DESC' },
    });
  }

  async update(publicId: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(publicId);
    Object.assign(hotel, updateHotelDto);
    const updatedHotel = await this.hotelRepository.save(hotel);
    this.logger.log(`Hotel actualizado: ${publicId}`);
    return updatedHotel;
  }

  async remove(publicId: string): Promise<void> {
    const hotel = await this.findOne(publicId);
    await this.hotelRepository.remove(hotel);
    this.logger.log(`Hotel eliminado: ${publicId}`);
  }
}
