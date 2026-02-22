import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomResponseDto } from './dto/room-response.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';
import { HotelService } from '../hotel/hotel.service';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly hotelService: HotelService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    const { hotelPublicId, ...roomData } = createRoomDto;
    const hotel = await this.hotelService.findOneEntity(hotelPublicId);

    const room = this.roomRepository.create({
      ...roomData,
      hotel,
    });

    const savedRoom = await this.roomRepository.save(room);
    this.logger.log(
      `Habitación ${savedRoom.number} creada para el hotel ${hotelPublicId}`,
    );

    return plainToInstance(RoomResponseDto, savedRoom, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<RoomResponseDto>> {
    this.logger.log(
      `Obteniendo habitaciones: página ${paginationDto.page}, límite ${paginationDto.limit}`,
    );

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.hotel', 'hotel')
      .orderBy('room.createdAt', 'DESC');

    const { data, meta } = await this.paginationService.paginate(
      queryBuilder,
      paginationDto,
    );

    const roomsDto = data.map((room) =>
      plainToInstance(RoomResponseDto, room, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: roomsDto,
      meta,
    };
  }

  async findOne(publicId: string): Promise<RoomResponseDto | null> {
    const room = await this.findOneEntity(publicId);
    return plainToInstance(RoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async findOneEntity(publicId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { publicId },
      relations: ['hotel'],
    });
    if (!room) {
      this.logger.warn(`Habitación no encontrada: ID ${publicId}`);
      throw new NotFoundException(
        `Habitación con ID ${publicId} no encontrada`,
      );
    }
    return room;
  }

  async update(
    publicId: string,
    updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    const room = await this.findOneEntity(publicId);
    this.roomRepository.merge(room, updateRoomDto);
    const updatedRoom = await this.roomRepository.save(room);
    this.logger.log(`Habitación actualizada: ${publicId}`);
    return plainToInstance(RoomResponseDto, updatedRoom, {
      excludeExtraneousValues: true,
    });
  }

  async remove(publicId: string): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { publicId } });
    if (!room) {
      this.logger.warn(`Habitación no encontrada: ID ${publicId}`);
      throw new NotFoundException(
        `Habitación con ID ${publicId} no encontrada`,
      );
    }
    await this.roomRepository.softRemove(room);
    this.logger.log(`Habitación eliminada (soft): ${publicId}`);
  }
}
