import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('hotels')
@Index(['city'])
@Index(['name', 'city'])
export class Hotel {
  @ApiProperty({
    description: 'ID interno del hotel',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID público único del hotel',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({type: 'uuid', unique: true})
  publicId: string;

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
  description: string;

  @ApiProperty({
    description: 'Calificación del hotel (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty({
    description: 'Fecha de creación del hotel',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del hotel',
    example: '2024-01-15T10:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
