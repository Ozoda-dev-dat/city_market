import { Controller, Post, Get, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() body: any) {
    return this.ordersService.create(body);
  }

  @Get('me')
  findMyOrders() {
    return this.ordersService.findByUser('mock-user-id');
  }
}
