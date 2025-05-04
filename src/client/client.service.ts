import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../user/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(data: CreateClientDto, user: User): Promise<Client> {
    const exists = await this.clientRepository.findOne({
      where: { document: data.document, user },
    });
    if (exists) {
      throw new ConflictException('Ya existe un cliente con ese documento para este usuario');
    }

    const client = this.clientRepository.create({
      ...data,
      user,
    });

    return this.clientRepository.save(client);
  }




  // async findAll(userId: string): Promise<Client[]> {
  //   return this.clientRepository.find({
  //     where: { user: { id: userId } },
  //     order: { createdAt: 'DESC' },
  //   });
  // }


  //código nuevo; acaá añadí también dos filtros: blocked y city
  async findAll(userId: string, filters: { blocked?: boolean; city?: string }): Promise<Client[]> {
    const where: any = {
      user: { id: userId },
    };
  
    if (filters.blocked !== undefined) {
      where.blocked = filters.blocked;
    }
  
    if (filters.city) {
      where.city = filters.city;
    }
  
    return this.clientRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
  

  async findOne(id: number, userId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    if (client.user.id !== userId) {
      throw new ForbiddenException('No tiene permiso para acceder a este cliente');
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
      throw new ForbiddenException('No tiene permiso para modificar este cliente');
    }

    if (data.document && data.document !== client.document) {
      const exists = await this.clientRepository.findOne({
        where: { document: data.document, user },
      });
      if (exists && exists.id !== client.id) {
        throw new ConflictException('Ya existe un cliente con ese documento para este usuario');
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
      throw new ForbiddenException('No tiene permiso para eliminar este cliente');
    }
    await this.clientRepository.delete(id);
  }
}
