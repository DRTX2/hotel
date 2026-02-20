import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomResponseDto } from './dto/room-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginatedResult, PaginationDto } from '../../common/dto/pagination.dto';
import { HotelService } from '../hotel/hotel.service';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly hotelService: HotelService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    const { hotelPublicId, ...roomData } = createRoomDto;
    const hotel = await this.hotelService.findOneEntity(hotelPublicId);

    const room = this.roomRepository.create({
      ...roomData,
      hotel,
    });
    
    const savedRoom = await this.roomRepository.save(room);
    this.logger.log(`Habitación ${savedRoom.number} creada para el hotel ${hotelPublicId}`);

    return plainToInstance(RoomResponseDto, savedRoom, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RoomResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    this.logger.log(`Obteniendo habitaciones: página ${page}, límite ${limit}`);

    const [rooms, total] = await this.roomRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = rooms.map((room) =>
      plainToInstance(RoomResponseDto, room, {
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

  async findOne(publicId: string): Promise<RoomResponseDto | null> {
    const room = this.roomRepository.findOne({ where: { publicId } });
    return room.then((room) => {
      if (!room) {
        this.logger.warn(`Habitación no encontrada: ID ${publicId}`);
        return null;
      }
      return plainToInstance(RoomResponseDto, room, {
        excludeExtraneousValues: true,
      });
    });
  }

  async update(publicId: string, updateRoomDto: UpdateRoomDto):Promise<RoomResponseDto | null> {
    const room = this.roomRepository.findOne({ where: { publicId } });
    return room.then(async (room) => {
      if (!room) {
        this.logger.warn(`Habitación no encontrada: ID ${publicId}`);
        return null;
      }
      this.roomRepository.merge(room, updateRoomDto);
      const updatedRoom = await this.roomRepository.save(room);
      return plainToInstance(RoomResponseDto, updatedRoom, {
        excludeExtraneousValues: true,
      });
    });
  }

  async remove(publicId: string): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { publicId } });
    if (!room) {
      this.logger.warn(`Habitación no encontrada: ID ${publicId}`);
      throw new NotFoundException(`Habitación con ID ${publicId} no encontrada`);
    }
    await this.roomRepository.softRemove(room);
    this.logger.log(`Habitación eliminada (soft): ${publicId}`);
  }
}
