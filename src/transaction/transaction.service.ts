import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { ILike, Repository } from 'typeorm';
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
      @InjectRepository(Client)  // Inyecta el repositorio de Client
      private readonly clientRepository: Repository<Client>,
    ) {}
  
    async create(data: CreateTransactionDto, user: User): Promise<Transaction> {
        // Verificar que el cliente existe
        const client = await this.clientRepository.findOne({ where: { id: parseInt(data.clientId, 10) } });
    
        if (!client) {
          throw new NotFoundException('Cliente no encontrado');
        }
    
        // Crear la transacción con el cliente encontrado
        const transaction = this.transactionRepository.create({
          ...data,
          owner: user, // Relacionar el usuario como propietario de la transacción
          client: client, // Relacionar la transacción con el cliente
        });
    
        return this.transactionRepository.save(transaction);
      }
  
    /**
     * Buscar todas las transacciones de un usuario, con filtros opcionales
     */
    async findAll(
        userId: string,
        filters?: {
          minAmount?: number;  // Filtro para monto mínimo
          maxAmount?: number;  // Filtro para monto máximo
          clientSearch?: string;
          startDate?: string;
          endDate?: string;
          order?: 'asc' | 'desc'; // Filtro para el orden
        },
      ): Promise<Transaction[]> {
        const query = this.transactionRepository
          .createQueryBuilder('transaction')
          .leftJoinAndSelect('transaction.owner', 'owner')
          .leftJoinAndSelect('transaction.client', 'client')
          .where('owner.id = :userId', { userId });
      
        // Filtro por monto mínimo
        if (filters?.minAmount !== undefined) {
          query.andWhere('transaction.amount >= :minAmount', { minAmount: filters.minAmount });
        }
      
        // Filtro por monto máximo
        if (filters?.maxAmount !== undefined) {
          query.andWhere('transaction.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }
      
        // Filtro por cliente
        if (filters?.clientSearch) {
          query.andWhere(
            `client.name ILIKE :search OR client.lastname ILIKE :search OR client.document ILIKE :search`,
            { search: `%${filters.clientSearch}%` },
          );
        }
      
        // Filtro por fecha
        if (filters?.startDate) {
          query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
        }
      
        if (filters?.endDate) {
          query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
        }
      
        // Orden por monto o fecha (por defecto por fecha)
        if (filters?.order === 'asc') {
          query.orderBy('transaction.amount', 'ASC'); // Orden por monto ascendente
        } else if (filters?.order === 'desc') {
          query.orderBy('transaction.amount', 'DESC'); // Orden por monto descendente
        } else {
          query.orderBy('transaction.createdAt', 'DESC'); // Orden por fecha descendente (predeterminado)
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
  