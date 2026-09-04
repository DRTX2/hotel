import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  GUEST = 'guest',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  /** Hash bcrypt. Nunca se expone en DTOs de respuesta. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  role: UserRole;

  /** SHA-256 del refresh token vigente. Null = sesión cerrada. */
  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  refreshTokenHash?: string | null;
}
