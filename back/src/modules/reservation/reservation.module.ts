import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { RoomModule } from '../room/room.module';
import { GuestModule } from '../guest/guest.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    RoomModule,
    GuestModule,
    PaginationModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservationModule {}
