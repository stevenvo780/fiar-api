import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FiarEventHandlerService } from './fiar-event-handler.service';
import { EventWebhookController } from './event-webhook.controller';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TransactionModule,
  ],
  controllers: [EventWebhookController],
  providers: [FiarEventHandlerService],
  exports: [FiarEventHandlerService],
})
export class EventsModule {}