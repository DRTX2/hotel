import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { Repository } from 'typeorm';
import { RoomService } from '../room/room.service';
import { GuestService } from '../guest/guest.service';
import { plainToInstance } from 'class-transformer';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly roomService: RoomService,
    private readonly guestService: GuestService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<ReservationResponseDto> {
    const { roomPublicId, guestPublicId, ...reservationData } = createReservationDto;

    const room = await this.roomService.findOneEntity(roomPublicId);
    const guest = await this.guestService.findOneEntity(guestPublicId);

    const reservation = this.reservationRepository.create({
      ...reservationData,
      room,
      guest,
      totalPrice: room.basePrice * 1, // Lógica simple inicial (1 noche)
    });

    const saved = await this.reservationRepository.save(reservation);
    this.logger.log(`Reserva creada: ${saved.publicId}`);

    return plainToInstance(ReservationResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    this.logger.log(
      `Obteniendo reservas: página ${paginationDto.page}, límite ${paginationDto.limit}`,
    );

    const queryBuilder = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.hotel', 'hotel')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .orderBy('reservation.createdAt', 'DESC');

    const { data, meta } = await this.paginationService.paginate(
      queryBuilder,
      paginationDto,
    );

    const reservationsDto = data.map((reservation) =>
      plainToInstance(ReservationResponseDto, reservation, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: reservationsDto,
      meta,
    };
  }

  async findOne(publicId: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { publicId },
      relations: ['room', 'guest', 'room.hotel'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva con ID ${publicId} no encontrada`);
    }

    return plainToInstance(ReservationResponseDto, reservation, {
      excludeExtraneousValues: true,
    });
  }

  async remove(publicId: string): Promise<void> {
    const reservation = await this.reservationRepository.findOne({ where: { publicId } });
    if (!reservation) {
      throw new NotFoundException(`Reserva con ID ${publicId} no encontrada`);
    }
    await this.reservationRepository.softRemove(reservation);
    this.logger.log(`Reserva eliminada (soft): ${publicId}`);
  }
}
