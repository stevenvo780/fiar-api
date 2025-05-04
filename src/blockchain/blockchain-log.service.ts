import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainLog } from './entities/blockchain-log.entity';
import { CreateBlockchainLogDto } from './dto/create-blockchain-log.dto';

@Injectable()
export class BlockchainLogService {
  constructor(
    @InjectRepository(BlockchainLog)
    private readonly blockchainLogRepository: Repository<BlockchainLog>,
  ) {}

  async create(data: CreateBlockchainLogDto): Promise<BlockchainLog> {
    const log = this.blockchainLogRepository.create(data);
    return this.blockchainLogRepository.save(log);
  }

  async findAll(): Promise<BlockchainLog[]> {
    return this.blockchainLogRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByEntity(
    entity: string,
    entityId: string,
  ): Promise<BlockchainLog[]> {
    return this.blockchainLogRepository.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
