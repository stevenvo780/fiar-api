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
      where: { email: data.email, user },
    });
    if (exists) {
      throw new ConflictException('El correo ya existe para este usuario');
    }
    const client = this.clientRepository.create({ ...data, user });
    return this.clientRepository.save(client);
  }

  async findAll(userId: string): Promise<Client[]> {
    return this.clientRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.user.id !== userId) {
      throw new ForbiddenException('No permission to access this client');
    }
    return client;
  }

  async update(id: number, data: UpdateClientDto, user: User): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.user.id !== user.id)
      throw new ForbiddenException('No permission to modify this client');
    if (data.email && data.email !== client.email) {
      const exists = await this.clientRepository.findOne({
        where: { email: data.email, user },
      });
      if (exists && exists.id !== client.id) {
        throw new ConflictException('El correo ya existe para este usuario');
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
    if (!client) throw new NotFoundException('Client not found');
    if (client.user.id !== user.id)
      throw new ForbiddenException('No permission to delete this client');
    await this.clientRepository.delete(id);
  }
}
