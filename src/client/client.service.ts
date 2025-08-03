import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../user/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(data: CreateClientDto, user: User): Promise<Client> {
    const exists = await this.clientRepository.findOne({
      where: { document: data.document, user: { id: user.id } },
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe un cliente con ese documento para este usuario',
      );
    }

    const client = this.clientRepository.create({
      ...data,
      user,
      current_balance: data.current_balance ?? data.credit_limit ?? 0,
    });

    return this.clientRepository.save(client);
  }

  async findAll(
    userId: string,
    options: {
      page: number;
      limit: number;
      blocked?: boolean;
      city?: string;
      document?: string;
    },
  ): Promise<PaginatedResponseDto<Client>> {
    const { page, limit, blocked, city, document } = options;
    const skip = (page - 1) * limit;

    const where: FindManyOptions<Client>['where'] = {
      user: { id: userId },
    };

    if (blocked !== undefined) {
      where.blocked = blocked;
    }

    if (city) {
      where.city = city;
    }

    if (document) {
      where.document = document;
    }

    const [data, total] = await this.clientRepository.findAndCount({
      where,
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' },
    });

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

  async findOne(id: number, userId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (client.user.id !== userId) {
      throw new ForbiddenException(
        'No tiene permiso para acceder a este cliente',
      );
    }
    return client;
  }

  async update(id: number, data: UpdateClientDto, user: User): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (client.user.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para modificar este cliente',
      );
    }

    if (data.document && data.document !== client.document) {
      const exists = await this.clientRepository.findOne({
        where: { document: data.document, user },
      });
      if (exists && exists.id !== client.id) {
        throw new ConflictException(
          'Ya existe un cliente con ese documento para este usuario',
        );
      }
    }

    Object.assign(client, data);

    return this.clientRepository.save(client);
  }

  async remove(id: number, user: User): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (client.user.id !== user.id) {
      throw new ForbiddenException(
        'No tiene permiso para eliminar este cliente',
      );
    }
    await this.clientRepository.delete(id);
  }

  /**
   * Verificar si el cliente tiene suficientes créditos para una transacción
   */
  async checkSufficientCredits(
    clientId: number,
    amount: number,
  ): Promise<boolean> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return Number(client.current_balance) >= Number(amount);
  }

  /**
   * Actualizar el balance de créditos del cliente
   */
  async updateCredits(
    clientId: number,
    amount: number,
    operation: 'income' | 'expense',
  ): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    if (operation === 'expense') {
      await this.checkSufficientCredits(clientId, amount);
      client.current_balance = Number(client.current_balance) - Number(amount);
    } else {
      const newBalance = Number(client.current_balance) + Number(amount);
      if (newBalance > client.credit_limit) {
        client.credit_limit = newBalance;
      }
      client.current_balance = newBalance;
    }

    return await this.clientRepository.save(client);
  }

  /**
   * Obtener el balance actual de créditos de un cliente
   */
  async getBalance(
    clientId: number,
    userId: string,
  ): Promise<{ current_balance: number; credit_limit: number }> {
    const client = await this.findOne(clientId, userId);
    return {
      current_balance: Number(client.current_balance),
      credit_limit: Number(client.credit_limit),
    };
  }

  /**
   * Verificar elegibilidad de crédito FIAR por documento (Flujo 3)
   * Usado por Hub Central para validar si cliente está en lista blanca
   */
  async checkWhitelistEligibility(document: string): Promise<{
    eligible: boolean;
    clientId?: number;
    creditLimit?: number;
    currentBalance?: number;
    availableCredit?: number;
    status: string;
    reason: string;
  }> {
    try {
      // Buscar cliente por documento en la base de datos FIAR
      const client = await this.clientRepository.findOne({
        where: { document },
        relations: ['user'],
      });

      if (!client) {
        return {
          eligible: false,
          status: 'not_found',
          reason: 'Cliente no encontrado en lista blanca FIAR',
        };
      }

      // Verificar si el cliente está bloqueado
      if (client.blocked) {
        return {
          eligible: false,
          clientId: client.id,
          creditLimit: Number(client.credit_limit),
          currentBalance: Number(client.current_balance),
          availableCredit: 0,
          status: 'blocked',
          reason: 'Cliente bloqueado para créditos FIAR',
        };
      }

      // Calcular crédito disponible
      const currentBalance = Number(client.current_balance);
      const creditLimit = Number(client.credit_limit);
      const availableCredit = Math.max(0, creditLimit - currentBalance);

      // Cliente elegible si tiene crédito disponible
      const eligible = availableCredit > 0;

      return {
        eligible,
        clientId: client.id,
        creditLimit,
        currentBalance,
        availableCredit,
        status: eligible ? 'eligible' : 'no_credit',
        reason: eligible 
          ? `Cliente elegible con $${availableCredit.toFixed(2)} crédito disponible`
          : 'Cliente sin crédito disponible',
      };

    } catch (error) {
      console.error('Error verificando elegibilidad FIAR:', error);
      return {
        eligible: false,
        status: 'error',
        reason: 'Error interno verificando elegibilidad',
      };
    }
  }
}
