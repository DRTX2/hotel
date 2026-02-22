import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from './dto/paginated-result.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Injectable } from '@nestjs/common';
import { PaginationMetaDto } from './dto/pagination-meta.dto';

@Injectable()
export class PaginationService {
  async paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<T>> {
    const page = paginationDto.page ?? 1;
    const limit = Math.max(paginationDto.limit ?? 10,1);
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    const meta: PaginationMetaDto = {
      total,
      page,
      limit,
      lastPage,
      hasNextPage: page < lastPage,
      hasPreviousPage: page > 1,
    };

    return {data, meta};
  }
}
