import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [AuthModule, ProductsModule, OrdersModule],
})
export class AppModule {}
