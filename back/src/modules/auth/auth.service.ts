import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { env } from '../../config/env';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Crea un usuario con rol explícito. Lo usan el seed, los tests
   * y el endpoint admin — nunca el registro público.
   */
  async createUser(
    email: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    const normalized = email.trim().toLowerCase();
    const exists = await this.users.findOne({
      where: { email: normalized },
    });
    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const user = await this.users.save(
      this.users.create({ email: normalized, passwordHash, role }),
    );
    this.logger.log(`Usuario creado: ${normalized} (${role})`);
    return user;
  }

  /** Registro público: siempre rol guest (sin escalado de privilegios). */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.createUser(dto.email, dto.password, UserRole.GUEST);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const normalized = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({
      where: { email: normalized },
    });
    // Mismo mensaje exista o no: no filtrar usuarios registrados
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.issueTokens(user);
  }

  /**
   * Rotación de refresh tokens: cada uso emite un par nuevo e invalida
   * el anterior. Si llega un token ya rotado, se revoca la sesión
   * completa (posible robo).
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let publicId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: env.jwt.refreshSecret },
      );
      publicId = payload.sub;
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.users.findOne({ where: { publicId } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sesión cerrada');
    }
    if (sha256(refreshToken) !== user.refreshTokenHash) {
      await this.users.update(user.id, { refreshTokenHash: null });
      this.logger.warn(`Reuso de refresh token, sesión revocada: ${publicId}`);
      throw new UnauthorizedException(
        'Refresh token reutilizado: sesión revocada',
      );
    }
    return this.issueTokens(user);
  }

  async logout(publicId: string): Promise<void> {
    await this.users.update({ publicId }, { refreshTokenHash: null });
  }

  async me(publicId: string): Promise<AuthUserDto> {
    const user = await this.users.findOne({ where: { publicId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return plainToInstance(
      AuthUserDto,
      {
        publicId: user.publicId,
        email: user.email,
        role: user.role,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    // jti único: cada token es distinto incluso dentro del mismo segundo
    // (los claims temporales de JWT solo tienen granularidad de segundos)
    const accessPayload = {
      sub: user.publicId,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };
    const accessExpiresIn = env.jwt.accessTtl as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = env.jwt.refreshTtl as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: env.jwt.accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwt.signAsync(
        { sub: user.publicId, jti: randomUUID() },
        { secret: env.jwt.refreshSecret, expiresIn: refreshExpiresIn },
      ),
    ]);

    await this.users.update(user.id, {
      refreshTokenHash: sha256(refreshToken),
    });

    return plainToInstance(
      AuthResponseDto,
      {
        accessToken,
        refreshToken,
        user: {
          publicId: user.publicId,
          email: user.email,
          role: user.role,
        },
      },
      { excludeExtraneousValues: true },
    );
  }
}
