import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainLog } from './entities/blockchain-log.entity';
import { BlockchainLogService } from './blockchain-log.service';
import { BlockchainLogController } from './blockchain-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainLog])],
  providers: [BlockchainLogService],
  controllers: [BlockchainLogController],
  exports: [BlockchainLogService],
})
export class BlockchainLogModule {}
