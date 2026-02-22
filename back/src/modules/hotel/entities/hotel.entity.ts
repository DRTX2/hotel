import {
  Entity,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Room } from '../../room/entities/room.entity';

@Entity('hotels')
@Index(['city'])
@Index(['name', 'city'])
export class Hotel extends BaseEntity {
  @ApiProperty({
    description: 'Nombre del hotel',
    example: 'Hotel Central Madrid',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Ciudad donde se encuentra el hotel',
    example: 'Madrid',
  })
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @ApiProperty({
    description: 'Descripción del hotel',
    example: 'Hotel de lujo en el centro de Madrid',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Calificación del hotel (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @OneToMany(() => Room, (room) => room.hotel)
  rooms: Room[];
}