import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WompiService } from './wompi.service';
import { WompiController } from './wompi.controller';
import { PaymentSource } from './entities/payment-source.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([PaymentSource]),
  ],
  providers: [WompiService],
  controllers: [WompiController],
  exports: [WompiService],
})
export class WompiModule {}
