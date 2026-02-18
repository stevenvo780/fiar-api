import {
  Module,
  NestModule,
  MiddlewareConsumer,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './logger.middleware';
import AppProvider from './app.provider';
import { typeOrmConfig } from './utils/typeorm.config';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ClientModule } from './client/client.module';
import { UserModule } from './user/user.module';
import { WompiModule } from './wompi/wompi.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    ProfileModule,
    ClientModule,
    TransactionModule,
    UserModule,
    WompiModule,
    MercadoPagoModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppProvider],
})
export class AppModule implements NestModule, OnModuleDestroy {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }

  async onModuleDestroy() {
    await AppProvider.closeConnection();
  }
}
