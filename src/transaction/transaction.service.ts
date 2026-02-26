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
import { ClientService } from '../client/client.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly clientService: ClientService,
  ) {}

  private async resolveClient(
    data: CreateTransactionDto,
    user: User,
  ): Promise<Client> {
    let client: Client;
    if (data.clientId) {
      client = await this.clientRepository.findOne({
        where: { id: parseInt(data.clientId, 10), user: { id: user.id } },
      });
      if (!client) {
        throw new NotFoundException('Cliente no encontrado por ID');
      }
    } else if (data.clientData) {
      const { document, phone, email } = data.clientData as any;
      let existing: Client | null = null;
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
      if (!existing && email) {
        existing = await this.clientRepository.findOne({
          where: { email, user: { id: user.id } },
        });
      }
      if (existing) {
        client = existing;
      } else {
        client = this.clientRepository.create({
          ...data.clientData,
          current_balance: 100000,
          credit_limit: 100000,
          user,
        });
        client = await this.clientRepository.save(client);
      }
    } else {
      throw new BadRequestException(
        'Se requiere clientId o clientData para crear transacción',
      );
    }
    return client;
  }

  async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
    const client = await this.resolveClient(data, user);

    if (!['income', 'expense'].includes(data.operation)) {
      throw new BadRequestException(
        'Tipo de operación inválido. Debe ser "income" o "expense"',
      );
    }

    if (data.operation === 'expense') {
      const hasSufficientCredits =
        await this.clientService.checkSufficientCredits(client.id, data.amount);

      if (!hasSufficientCredits) {
        const balance = await this.clientService.getBalance(client.id, user.id);
        throw new BadRequestException(
          `Créditos insuficientes. Créditos disponibles: ${balance.current_balance}, Monto solicitado: ${data.amount}`,
        );
      }
    }

    const transaction = this.transactionRepository.create({
      ...data,
      owner: user,
      client,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    if (
      savedTransaction.status === 'approved' ||
      savedTransaction.status === 'completed'
    ) {
      await this.clientService.updateCredits(
        client.id,
        data.amount,
        data.operation,
      );
    }

    return savedTransaction;
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
      if (filters.status === 'not_approved') {
        query.andWhere('transaction.status != :status', {
          status: 'approved',
        });
      } else {
        query.andWhere('transaction.status = :status', {
          status: filters.status,
        });
      }
    }

    if (filters?.order === 'asc') {
      query.orderBy('transaction.createdAt', 'ASC');
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
      relations: ['owner', 'client'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para modificar esta transacción',
      );
    }

    const originalStatus = transaction.status;
    const originalAmount = transaction.amount;
    const originalOperation = transaction.operation;

    const isBecomingApproved =
      (data.status === 'approved' || data.status === 'completed') &&
      originalStatus !== 'approved' &&
      originalStatus !== 'completed';

    const isBecomingPending =
      (originalStatus === 'approved' || originalStatus === 'completed') &&
      data.status &&
      data.status !== 'approved' &&
      data.status !== 'completed';

    Object.assign(transaction, data);
    const updatedTransaction = await this.transactionRepository.save(
      transaction,
    );

    if (isBecomingApproved) {
      if (transaction.operation === 'expense') {
        const hasSufficientCredits =
          await this.clientService.checkSufficientCredits(
            transaction.client.id,
            transaction.amount,
          );
        if (!hasSufficientCredits) {
          transaction.status = originalStatus;
          await this.transactionRepository.save(transaction);
          const balance = await this.clientService.getBalance(
            transaction.client.id,
            user.id,
          );
          throw new BadRequestException(
            `Créditos insuficientes. Créditos disponibles: ${balance.current_balance}, Monto solicitado: ${transaction.amount}`,
          );
        }
      }
      await this.clientService.updateCredits(
        transaction.client.id,
        transaction.amount,
        transaction.operation,
      );
    } else if (isBecomingPending) {
      const reverseOperation =
        originalOperation === 'expense' ? 'income' : 'expense';
      await this.clientService.updateCredits(
        transaction.client.id,
        originalAmount,
        reverseOperation,
      );
    }

    return updatedTransaction;
  }

  async remove(id: string, user: User): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['owner', 'client'],
    });
    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.owner.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para eliminar esta transacción',
      );
    }

    if (
      transaction.status === 'approved' ||
      transaction.status === 'completed'
    ) {
      const reverseOperation =
        transaction.operation === 'expense' ? 'income' : 'expense';
      await this.clientService.updateCredits(
        transaction.client.id,
        transaction.amount,
        reverseOperation,
      );
    }

    await this.transactionRepository.delete(id);
  }
}
