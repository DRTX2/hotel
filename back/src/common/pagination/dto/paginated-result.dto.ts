import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedResult<T> {
  data: T[];
  meta: PaginationMetaDto;
}
