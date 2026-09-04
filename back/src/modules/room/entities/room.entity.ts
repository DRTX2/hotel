import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Hotel } from '../../hotel/entities/hotel.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  SUITE = 'SUITE',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('rooms')
export class Room extends BaseEntity {
  @ApiProperty({
    description: 'Número de habitación o identificador',
    example: '101A',
  })
  @Column({ name: 'number', type: 'varchar', length: 50 })
  @Index()
  number: string;

  @ApiProperty({
    description: 'Estado de la habitación',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  @Column({
    name: 'status',
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @ApiProperty({
    description: 'Tipo de habitación',
    enum: RoomType,
    default: RoomType.SINGLE,
  })
  @Column({
    name: 'type',
    type: 'enum',
    enum: RoomType,
    default: RoomType.SINGLE,
  })
  type: RoomType;

  @ApiProperty({
    description: 'Precio base por noche',
    example: 100,
  })
  @Column({ name: 'base_price', type: 'int' })
  basePrice: number;

  @ApiProperty({
    description: 'Capacidad máxima de huéspedes',
    example: 2,
  })
  @Column({ name: 'capacity', type: 'int' })
  capacity: number;

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'hotel_id' })
  hotelId: number;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];
}
