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

  // Helper to resolve or create client
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
      const { document, phone } = data.clientData as any;
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
    return client;
  }

  async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
    const client = await this.resolveClient(data, user);

    if (!['income', 'expense'].includes(data.operation)) {
      throw new BadRequestException(
        'Tipo de operación inválido. Debe ser "income" o "expense"',
      );
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
      // Ajuste directo de saldo sin validaciones
      const clientToUpdate = await this.clientRepository.findOne({
        where: { id: client.id },
      });
      clientToUpdate.current_balance =
        data.operation === 'expense'
          ? Number(clientToUpdate.current_balance) - Number(data.amount)
          : Number(clientToUpdate.current_balance) + Number(data.amount);
      const updatedClient = await this.clientRepository.save(clientToUpdate);
      savedTransaction.client = updatedClient;
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

    // Si se está cambiando el estado a approved/completed y antes no estaba
    const isBecomingApproved =
      (data.status === 'approved' || data.status === 'completed') &&
      originalStatus !== 'approved' &&
      originalStatus !== 'completed';

    // Si se está cambiando el estado desde approved/completed a otro
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
      // Ajuste directo de saldo sin validación
      const clientEntity = await this.clientRepository.findOne({
        where: { id: transaction.client.id },
      });
      clientEntity.current_balance =
        Number(clientEntity.current_balance) - Number(transaction.amount);
      await this.clientRepository.save(clientEntity);
    }
    if (isBecomingPending) {
      const clientEntity = await this.clientRepository.findOne({
        where: { id: transaction.client.id },
      });
      clientEntity.current_balance =
        Number(clientEntity.current_balance) + Number(originalAmount);
      await this.clientRepository.save(clientEntity);
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
    await this.transactionRepository.remove(transaction);
  }
}
