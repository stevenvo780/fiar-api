import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import axios from 'axios';
import { BlockchainLogService } from '../blockchain/blockchain-log.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly blockchainLogService: BlockchainLogService,
  ) {}

  async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
    const lastTx = await this.transactionRepository.findOne({
      where: { owner: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
    if (lastTx?.txn_hash) {
      const statusResp = await axios.get(
        `${process.env.BLOCKCHAIN_API_URL}/transaction_status/${lastTx.txn_hash}`,
      );
      if (statusResp.data.status !== 1) {
        throw new BadRequestException(
          'Integrity check failed: last transaction invalid',
        );
      }
    }

    let client: Client;
    if (data.clientId) {
      client = await this.clientRepository.findOne({
        where: { id: parseInt(data.clientId, 10), user: { id: user.id } },
      });
      if (!client) throw new NotFoundException('Cliente no encontrado por ID');
    } else if (data.clientData) {
      const { phone, document } = data.clientData;
      let existing = null;
      if (phone) {
        existing = await this.clientRepository.findOne({
          where: { phone, user: { id: user.id } },
        });
      }
      if (!existing && document) {
        existing = await this.clientRepository.findOne({
          where: { document, user: { id: user.id } },
        });
      }
      if (existing) {
        client = existing;
      } else {
        client = this.clientRepository.create({
          ...data.clientData,
          user,
        });
        client = await this.clientRepository.save(client);
      }
    } else {
      throw new BadRequestException(
        'Se requiere clientId o clientData para crear transacción',
      );
    }

    let transaction = this.transactionRepository.create({
      ...data,
      owner: user,
      client,
    });
    transaction = await this.transactionRepository.save(transaction);
    const payload = {
      private_key: process.env.BLOCKCHAIN_PRIVATE_KEY,
      to: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      data: `evento=transaccion;transaction_id=${
        transaction.id
      };timestamp=${transaction.createdAt.toISOString()}`,
    };
    const logResp = await axios.post(
      `${process.env.BLOCKCHAIN_API_URL}/log_event`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    const txHash = logResp.data.tx_hash;

    transaction.txn_hash = txHash;
    await this.transactionRepository.save(transaction);

    await this.blockchainLogService.create({
      entity: 'transaction',
      entityId: transaction.id,
      txnHash: txHash,
      contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      network: process.env.BLOCKCHAIN_NETWORK,
      blockNumber: logResp.data.block_number,
      signature: txHash,
      proof: logResp.data.logged_data
        ? { logged: logResp.data.logged_data }
        : undefined,
    });
    return transaction;
  }

  async findAll(
    userId: string,
    filters?: {
      minAmount?: number;
      maxAmount?: number;
      clientSearch?: string;
      startDate?: string;
      endDate?: string;
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      status?: string;
    },
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    last_page: number;
  }> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    let limit = filters?.limit && filters.limit > 0 ? filters.limit : 10;
    limit = limit > 100 ? 100 : limit;
    const skip = (page - 1) * limit;

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.owner', 'owner')
      .leftJoinAndSelect('transaction.client', 'client')
      .where('owner.id = :userId', { userId });

    if (filters?.minAmount !== undefined) {
      query.andWhere('transaction.amount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters?.maxAmount !== undefined) {
      query.andWhere('transaction.amount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    if (filters?.clientSearch) {
      query.andWhere(
        `client.name ILIKE :search OR client.lastname ILIKE :search OR client.document ILIKE :search`,
        { search: `%${filters.clientSearch}%` },
      );
    }

    if (filters?.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.status) {
      query.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.order === 'asc') {
      query.orderBy('transaction.amount', 'ASC');
    } else if (filters?.order === 'desc') {
      query.orderBy('transaction.amount', 'DESC');
    } else {
      query.orderBy('transaction.createdAt', 'DESC');
    }

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const total_pages = Math.ceil(total / limit);
    const last_page = total_pages;

    return {
      data,
      total,
      page,
      limit,
      total_pages,
      last_page,
    };
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['owner', 'client'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.owner.id !== userId) {
      throw new ForbiddenException(
        'No tiene permiso para acceder a esta transacción',
      );
    }
    return transaction;
  }

  async update(
    id: string,
    data: UpdateTransactionDto,
    user: User,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para modificar esta transacción',
      );
    }

    Object.assign(transaction, data);
    return await this.transactionRepository.save(transaction);
  }

  async remove(id: string, user: User): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para eliminar esta transacción',
      );
    }
    await this.transactionRepository.delete(id);
  }
}
