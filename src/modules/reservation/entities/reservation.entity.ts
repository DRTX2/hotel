import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Room } from '../../room/entities/room.entity';
import { Guest } from '../../guest/entities/guest.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation extends BaseEntity {
  @ApiProperty({ description: 'Fecha de ingreso', example: '2024-05-01' })
  @Column({ type: 'date' })
  @Index()
  checkIn: string;

  @ApiProperty({ description: 'Fecha de salida', example: '2024-05-05' })
  @Column({ type: 'date' })
  @Index()
  checkOut: string;

  @ApiProperty({ description: 'Número de huéspedes', example: 2 })
  @Column({ type: 'int', default: 1 })
  numGuests: number;

  @ApiProperty({ description: 'Estado de la reserva', enum: ReservationStatus })
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiProperty({ description: 'Precio total de la reserva', example: 450 })
  @Column({ type: 'int', default: 0 })
  totalPrice: number;

  @ManyToOne(() => Room, (room) => room.reservations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: number;

  @ManyToOne(() => Guest, (guest) => guest.reservations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'guestId' })
  guest: Guest;

  @Column()
  guestId: number;
}
