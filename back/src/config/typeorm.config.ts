import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hotel_db',
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations_history',
    // synchronize: false en todos los entornos — las migraciones son la fuente de verdad
    synchronize: false,
    migrationsRun: true, // ejecuta migraciones pendientes al iniciar la app
    logging: !isProduction,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};
