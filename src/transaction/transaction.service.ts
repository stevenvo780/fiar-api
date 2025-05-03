import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { ILike, Repository } from 'typeorm';
  import { Transaction } from './entities/transaction.entity';
  import { User } from '../user/entities/user.entity';
  import { CreateTransactionDto } from './dto/create-transaction.dto';
  import { UpdateTransactionDto } from './dto/update-transaction.dto';
  
  @Injectable()
  export class TransactionService {
    constructor(
      @InjectRepository(Transaction)
      private readonly transactionRepository: Repository<Transaction>,
    ) {}
  
    async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
      const transaction = this.transactionRepository.create({
        ...data,
        owner: user,
      });
      return this.transactionRepository.save(transaction);
    }
  
    /**
     * Buscar todas las transacciones de un usuario, con filtros opcionales
     */
    async findAll(
      userId: string,
      filters?: {
        amount?: number;
        clientSearch?: string;
      },
    ): Promise<Transaction[]> {
      const query = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.owner', 'owner')
        .leftJoinAndSelect('transaction.client', 'client')
        .where('owner.id = :userId', { userId });
  
      if (filters?.amount !== undefined) {
        query.andWhere('transaction.amount = :amount', { amount: filters.amount });
      }
  
      if (filters?.clientSearch) {
        query.andWhere(
          `client.name ILIKE :search OR client.lastname ILIKE :search OR client.document ILIKE :search`,
          { search: `%${filters.clientSearch}%` },
        );
      }
  
      query.orderBy('transaction.createdAt', 'DESC');
  
      return query.getMany();
    }
  
    async findOne(id: string, userId: string): Promise<Transaction> {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['owner', 'client'],
      });
      if (!transaction) throw new NotFoundException('Transacción no encontrada');
      if (transaction.owner.id !== userId) {
        throw new ForbiddenException('No tiene permiso para acceder a esta transacción');
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
        throw new ForbiddenException('No tiene permiso para modificar esta transacción');
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
        throw new ForbiddenException('No tiene permiso para eliminar esta transacción');
      }
      await this.transactionRepository.delete(id);
    }
  }
  