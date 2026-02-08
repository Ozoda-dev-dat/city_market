import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  async findAll() {
    return []; // Return mock data or query DB
  }

  async findOne(id: string) {
    return { id, name: 'Mock Product' };
  }
}
