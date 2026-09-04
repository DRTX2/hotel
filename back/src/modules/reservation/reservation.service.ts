import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Room, RoomStatus } from '../room/entities/room.entity';
import { RoomService } from '../room/room.service';
import { GuestService } from '../guest/guest.service';
import { plainToInstance } from 'class-transformer';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { CancelReservationResponseDto } from './dto/cancel-reservation-response.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';
import {
  daysUntil,
  isValidRange,
  nightsBetween,
} from '../../common/utils/dates';
import { refundPercentFor } from './reservation.policy';

const ACTIVE_STATUSES = [ReservationStatus.PENDING, ReservationStatus.PAID];

function pgCode(err: unknown): string | undefined {
  if (err instanceof QueryFailedError) {
    const driver = (err as unknown as { driverError?: { code?: unknown } })
      .driverError;
    if (typeof driver?.code === 'string') return driver.code;
  }
  const direct = (err as { code?: unknown })?.code;
  return typeof direct === 'string' ? direct : undefined;
}

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly roomService: RoomService,
    private readonly guestService: GuestService,
    private readonly paginationService: PaginationService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Crear ──────────────────────────────────────────────────────────
  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const { roomPublicId, guestPublicId, checkIn, checkOut, numGuests } =
      createReservationDto;

    this.assertValidRange(checkIn, checkOut);

    const [room, guest] = await Promise.all([
      this.roomService.findOneEntity(roomPublicId),
      this.guestService.findOneEntity(guestPublicId),
    ]);
    this.assertCapacity(numGuests, room.capacity);

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        await this.lockRoom(manager, room.id);
        await this.assertNoOverlap(manager, room.id, checkIn, checkOut);

        const reservation = manager.getRepository(Reservation).create({
          room,
          guest,
          checkIn,
          checkOut,
          numGuests,
          status: ReservationStatus.PENDING,
          totalPrice: nightsBetween(checkIn, checkOut) * room.basePrice,
        });
        return manager.getRepository(Reservation).save(reservation);
      });

      this.logger.log(`Reserva creada: ${saved.publicId}`);
      return this.toDto(saved.publicId);
    } catch (err) {
      // Última red de seguridad: el constraint de exclusión ganó la carrera
      if (pgCode(err) === '23P01') {
        throw new ConflictException(
          'La habitación ya está reservada en ese rango de fechas',
        );
      }
      throw err;
    }
  }

  // ─── Listar / obtener ───────────────────────────────────────────────
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
    return this.toDto(publicId);
  }

  // ─── Actualizar fechas / huéspedes ──────────────────────────────────
  async update(
    publicId: string,
    dto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    const current = await this.findEntityWithRelations(publicId);

    if (current.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException(
        'Una reserva cancelada no se puede modificar',
      );
    }
    if (dto.roomPublicId && dto.roomPublicId !== current.room.publicId) {
      throw new BadRequestException(
        'Para cambiar de habitación crea una nueva reserva',
      );
    }
    if (dto.guestPublicId && dto.guestPublicId !== current.guest.publicId) {
      throw new BadRequestException(
        'Para cambiar de huésped crea una nueva reserva',
      );
    }
    if (dto.status && dto.status !== current.status) {
      throw new BadRequestException(
        'El estado se cambia vía check-in, check-out, cancelación o pago',
      );
    }

    const checkIn = dto.checkIn ?? current.checkIn;
    const checkOut = dto.checkOut ?? current.checkOut;
    const numGuests = dto.numGuests ?? current.numGuests;
    this.assertValidRange(checkIn, checkOut);
    this.assertCapacity(numGuests, current.room.capacity);

    const unchanged =
      checkIn === current.checkIn &&
      checkOut === current.checkOut &&
      numGuests === current.numGuests;
    if (unchanged) return this.toDto(publicId);

    try {
      await this.dataSource.transaction(async (manager) => {
        await this.lockRoom(manager, current.room.id);
        await this.assertNoOverlap(
          manager,
          current.room.id,
          checkIn,
          checkOut,
          current.id,
        );
        await manager.getRepository(Reservation).update(current.id, {
          checkIn,
          checkOut,
          numGuests,
          totalPrice: nightsBetween(checkIn, checkOut) * current.room.basePrice,
        });
      });
      this.logger.log(`Reserva actualizada: ${publicId}`);
      return this.toDto(publicId);
    } catch (err) {
      if (pgCode(err) === '23P01') {
        throw new ConflictException(
          'La habitación ya está reservada en ese rango de fechas',
        );
      }
      throw err;
    }
  }

  // ─── Check-in ───────────────────────────────────────────────────────
  async checkIn(publicId: string): Promise<ReservationResponseDto> {
    const current = await this.findEntityWithRelations(publicId);

    if (current.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede hacer check-in de una reserva cancelada',
      );
    }
    if (current.room.status === RoomStatus.MAINTENANCE) {
      throw new ConflictException(
        'La habitación está en mantenimiento, no admite check-in',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.lockRoom(manager, current.room.id);
      await this.assertNoOverlap(
        manager,
        current.room.id,
        current.checkIn,
        current.checkOut,
        current.id,
      );
      await manager.getRepository(Reservation).update(current.id, {
        status: ReservationStatus.PAID, // cobro en mostrador
      });
      await manager
        .getRepository(Room)
        .update(current.room.id, { status: RoomStatus.OCCUPIED });
    });

    this.logger.log(`Check-in: reserva ${publicId}`);
    return this.toDto(publicId);
  }

  // ─── Check-out ──────────────────────────────────────────────────────
  async checkOut(publicId: string): Promise<ReservationResponseDto> {
    const current = await this.findEntityWithRelations(publicId);

    if (current.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede hacer check-out de una reserva cancelada',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const roomRepo = manager.getRepository(Room);
      const locked = await this.lockRoom(manager, current.room.id);
      if (locked.status === RoomStatus.OCCUPIED) {
        await roomRepo.update(current.room.id, {
          status: RoomStatus.AVAILABLE,
        });
      }
    });

    this.logger.log(`Check-out: reserva ${publicId}`);
    return this.toDto(publicId);
  }

  // ─── Cancelar (con política de reembolso) ───────────────────────────
  async cancel(publicId: string): Promise<CancelReservationResponseDto> {
    const current = await this.findEntityWithRelations(publicId);

    if (current.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    const refundPercent = refundPercentFor(daysUntil(current.checkIn));

    await this.dataSource.transaction(async (manager) => {
      await this.lockRoom(manager, current.room.id);
      await manager.getRepository(Reservation).update(current.id, {
        status: ReservationStatus.CANCELLED,
      });
      await manager
        .getRepository(Room)
        .update(current.room.id, { status: RoomStatus.AVAILABLE });
    });

    this.logger.log(
      `Reserva cancelada: ${publicId} (reembolso ${refundPercent}%)`,
    );
    const reservation = await this.toDto(publicId);
    return plainToInstance(
      CancelReservationResponseDto,
      { reservation, refundPercent },
      { excludeExtraneousValues: true },
    );
  }

  // ─── Eliminar (soft delete; libera la habitación si estaba activa) ──
  async remove(publicId: string): Promise<void> {
    const current = await this.findEntityWithRelations(publicId);

    await this.dataSource.transaction(async (manager) => {
      if (
        current.status === ReservationStatus.PENDING ||
        current.status === ReservationStatus.PAID
      ) {
        await manager.getRepository(Reservation).update(current.id, {
          status: ReservationStatus.CANCELLED,
        });
        await manager
          .getRepository(Room)
          .update(current.room.id, { status: RoomStatus.AVAILABLE });
      }
      await manager.getRepository(Reservation).softRemove(current);
    });

    this.logger.log(`Reserva eliminada (soft): ${publicId}`);
  }

  // ─── Helpers privados ───────────────────────────────────────────────
  private assertValidRange(checkIn: string, checkOut: string): void {
    if (!isValidRange(checkIn, checkOut)) {
      throw new BadRequestException(
        'checkOut debe ser una fecha posterior a checkIn (formato YYYY-MM-DD)',
      );
    }
  }

  private assertCapacity(numGuests: number, capacity: number): void {
    if (numGuests > capacity) {
      throw new BadRequestException(
        `La habitación admite máximo ${capacity} huésped(es)`,
      );
    }
  }

  /** Bloqueo pesimista de la fila de habitación: serializa reservas concurrentes. */
  private async lockRoom(
    manager: EntityManager,
    roomId: number,
  ): Promise<Room> {
    const locked = await manager.findOne(Room, {
      where: { id: roomId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!locked) {
      throw new NotFoundException(`Habitación con ID ${roomId} no encontrada`);
    }
    return locked;
  }

  private async assertNoOverlap(
    manager: EntityManager,
    roomId: number,
    checkIn: string,
    checkOut: string,
    excludeId?: number,
  ): Promise<void> {
    const qb = manager
      .getRepository(Reservation)
      .createQueryBuilder('r')
      .where('r.roomId = :roomId', { roomId })
      .andWhere('r.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('r.checkIn < :checkOut', { checkOut })
      .andWhere('r.checkOut > :checkIn', { checkIn });

    if (excludeId !== undefined) {
      qb.andWhere('r.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new ConflictException(
        'La habitación ya está reservada en ese rango de fechas',
      );
    }
  }

  private async findEntityWithRelations(
    publicId: string,
  ): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { publicId },
      relations: ['room', 'guest'],
    });
    if (!reservation) {
      throw new NotFoundException(`Reserva con ID ${publicId} no encontrada`);
    }
    return reservation;
  }

  private async toDto(publicId: string): Promise<ReservationResponseDto> {
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
}
