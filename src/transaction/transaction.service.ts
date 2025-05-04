import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
    const client = await this.clientRepository.findOne({
      where: { id: parseInt(data.clientId, 10) },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const transaction = this.transactionRepository.create({
      ...data,
      owner: user,
      client: client,
    });

    return this.transactionRepository.save(transaction);
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
    },
  ): Promise<Transaction[]> {
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

    if (filters?.order === 'asc') {
      query.orderBy('transaction.amount', 'ASC');
    } else if (filters?.order === 'desc') {
      query.orderBy('transaction.amount', 'DESC');
    } else {
      query.orderBy('transaction.createdAt', 'DESC');
    }

    return query.getMany();
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
    return this.transactionRepository.save(transaction);
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
