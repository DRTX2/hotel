import { Entity, Column, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Reservation } from '../../reservation/entities/reservation.entity';

@Entity('guests')
export class Guest extends BaseEntity {
  @ApiProperty({
    description: 'Nombre completo del huésped',
    example: 'Juan Pérez',
  })
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan@example.com',
  })
  @Column({ name: 'email', type: 'varchar', length: 100, unique: true })
  email: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+34 600000000',
  })
  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Tipo de documento', example: 'DNI' })
  @Column({ name: 'document_type', type: 'varchar', length: 20 })
  documentType: string;

  @ApiProperty({ description: 'Número de documento', example: '12345678A' })
  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  @Index()
  documentNumber: string;

  @OneToMany(() => Reservation, (reservation) => reservation.guest)
  reservations: Reservation[];
}
