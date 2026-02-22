import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { Guest } from './entities/guest.entity';
import { PaginationModule } from '../../common/pagination/pagination.module';

@Module({
  imports: [TypeOrmModule.forFeature([Guest]), PaginationModule],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
