import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  async create(data: any) {
    return { id: 'mock-order-id', ...data };
  }

  async findByUser(userId: string) {
    return [];
  }
}
