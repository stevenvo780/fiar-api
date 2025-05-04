import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
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
}
