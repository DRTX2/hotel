import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { HotelModule } from './modules/hotel/hotel.module';
import { RoomModule } from './modules/room/room.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { GuestModule } from './modules/guest/guest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // no siempre se usa, ya que puede haber vars del SO
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    HotelModule,
    RoomModule,
    ReservationModule,
    GuestModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
