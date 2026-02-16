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
      this.logger.log(`Hotel creado: ${savedHotel.id}`);
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

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({ where: { id } });
    if (!hotel) {
      this.logger.warn(`Hotel no encontrado: ${id}`);
      throw new NotFoundException(`Hotel con ID ${id} no encontrado`);
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

  async update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(id);
    Object.assign(hotel, updateHotelDto);
    const updatedHotel = await this.hotelRepository.save(hotel);
    this.logger.log(`Hotel actualizado: ${id}`);
    return updatedHotel;
  }

  async remove(id: string): Promise<void> {
    const hotel = await this.findOne(id);
    await this.hotelRepository.remove(hotel);
    this.logger.log(`Hotel eliminado: ${id}`);
  }
}
