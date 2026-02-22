import {
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export abstract class BaseEntity { // ver si mejor lo elimino
  @ApiProperty({
    description: 'ID interno del registro',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID público único del registro (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  @Expose()
  publicId: string;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-15T10:30:00Z',
  })
  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Fecha de eliminación lógica (si aplica)',
    required: false,
  })
  @DeleteDateColumn()
  @Expose()
  deletedAt?: Date;
}
