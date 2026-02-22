import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { Guest } from './entities/guest.entity';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginatedResult } from '../../common/pagination/dto/paginated-result.dto';
import { plainToInstance } from 'class-transformer';
import { GuestResponseDto } from './dto/guest-response.dto';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createGuestDto: CreateGuestDto): Promise<GuestResponseDto> {
    const guest = this.guestRepository.create(createGuestDto);
    const saved = await this.guestRepository.save(guest);
    this.logger.log(`Huésped creado: ${saved.publicId}`);
    return plainToInstance(GuestResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async update(publicId: string, updateGuestDto: UpdateGuestDto): Promise<GuestResponseDto> {
    const guest = await this.findOneEntity(publicId);
    this.guestRepository.merge(guest, updateGuestDto);
    const updatedGuest = await this.guestRepository.save(guest);
    this.logger.log(`Huésped actualizado: ${publicId}`);
    return plainToInstance(GuestResponseDto, updatedGuest, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(publicId: string): Promise<GuestResponseDto> {
    const guest = await this.findOneEntity(publicId);
    return plainToInstance(GuestResponseDto, guest, {
      excludeExtraneousValues: true,
    });
  }

  async findOneEntity(publicId: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({ where: { publicId } });
    if (!guest) {
      this.logger.warn(`Huésped no encontrado: ${publicId}`);
      throw new NotFoundException(`Huésped con ID ${publicId} no encontrado`);
    }
    return guest;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<GuestResponseDto>> {
    this.logger.log(`Obteniendo huéspedes: página ${paginationDto.page}, límite ${paginationDto.limit}`);

    const queryBuilder = this.guestRepository
      .createQueryBuilder('guest')
      .orderBy('guest.createdAt', 'DESC');

    const { data, meta } = await this.paginationService.paginate(
      queryBuilder,
      paginationDto,
    );

    const guestsDto = data.map((guest) =>
      plainToInstance(GuestResponseDto, guest, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: guestsDto,
      meta,
    };
  }

  async remove(publicId: string): Promise<void> {
    const guest = await this.guestRepository.findOne({ where: { publicId } });
    if (!guest) {
      throw new NotFoundException(`Huésped con ID ${publicId} no encontrado`);
    }
    await this.guestRepository.softRemove(guest);
    this.logger.log(`Huésped eliminado (soft): ${publicId}`);
  }
}
