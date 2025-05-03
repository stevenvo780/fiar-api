import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainLog } from './entities/blockchain-log.entity';
import { BlockchainLogService } from './blockchain-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainLog])],
  providers: [BlockchainLogService],
  exports: [BlockchainLogService],
})
export class BlockchainLogModule {}
