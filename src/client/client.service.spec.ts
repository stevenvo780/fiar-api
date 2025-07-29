import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientService } from './client.service';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../user/entities/user.entity';

describe('ClientService', () => {
  let service: ClientService;
  let repo: Partial<Repository<Client>>;
  const user: User = { id: 'u1' } as any;

  beforeEach(() => {
    repo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() } as any;
    service = new ClientService(repo as Repository<Client>);
  });

  it('creates a client', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    (repo.create as jest.Mock).mockImplementation((data) => data);
    (repo.save as jest.Mock).mockImplementation(async (c) => c);
    const dto = { document: '123' } as any;
    const result = await service.create(dto, user);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result.document).toBe('123');
    expect(result.user).toBe(user);
  });

  it('throws conflict if document exists', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as Client);
    await expect(service.create({ document: '123' } as any, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('checkSufficientCredits returns false when balance low', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ current_balance: 5 } as Client);
    const result = await service.checkSufficientCredits(1, 10);
    expect(result).toBe(false);
  });

  it('updateCredits subtracts on expense', async () => {
    const client = { id: 1, current_balance: 20, credit_limit: 30 } as Client;
    (repo.findOne as jest.Mock).mockResolvedValue(client);
    (repo.save as jest.Mock).mockResolvedValue(client);
    jest.spyOn(service, 'checkSufficientCredits').mockResolvedValue(true);
    const result = await service.updateCredits(1, 10, 'expense');
    expect(result.current_balance).toBe(10);
  });
});
