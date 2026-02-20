import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { HotelModule } from '../hotel/hotel.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), HotelModule],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
