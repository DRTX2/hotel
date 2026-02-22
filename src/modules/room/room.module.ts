import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { HotelModule } from '../hotel/hotel.module';
import { PaginationModule } from '../../common/pagination/pagination.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), HotelModule, PaginationModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
