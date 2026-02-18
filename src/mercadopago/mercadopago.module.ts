import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercadoPagoService } from './mercadopago.service';
import { MercadoPagoController } from './mercadopago.controller';
import { PaymentSource } from '../wompi/entities/payment-source.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([PaymentSource]),
  ],
  providers: [MercadoPagoService],
  controllers: [MercadoPagoController],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
