import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { ClientModule } from '../client/client.module';
import { HttpModule } from '@nestjs/axios';
import { BlockchainLogModule } from '../blockchain/blockchain-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ClientModule,
    HttpModule.register({ baseURL: process.env.BLOCKCHAIN_API_URL }),
    BlockchainLogModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
