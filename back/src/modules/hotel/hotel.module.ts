import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { HotelService } from './hotel.service';
import { HotelController } from './hotel.controller';
import { PaginationModule } from '../../common/pagination/pagination.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel]), PaginationModule],
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
})
export class HotelModule {}
