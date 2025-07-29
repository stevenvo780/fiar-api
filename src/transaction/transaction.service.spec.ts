import { BadRequestException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Repository } from 'typeorm';
import { ClientService } from '../client/client.service';
import { Transaction } from './entities/transaction.entity';
import { Client } from '../client/entities/client.entity';
import { User } from '../user/entities/user.entity';

describe('TransactionService', () => {
  let service: TransactionService;
  let txRepo: Partial<Repository<Transaction>>;
  let clientRepo: Partial<Repository<Client>>;
  let clientService: Partial<ClientService>;

  beforeEach(() => {
    txRepo = { create: jest.fn(), save: jest.fn() } as any;
    clientRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
    clientService = { updateCredits: jest.fn(), checkSufficientCredits: jest.fn(), getBalance: jest.fn() } as any;
    service = new TransactionService(txRepo as any, clientRepo as any, clientService as any);
  });

  it('throws when operation invalid', async () => {
    jest.spyOn(service as any, 'resolveClient').mockResolvedValue({ id: 1 } as Client);
    await expect(
      service.create({ operation: 'other', clientId: '1', amount: 5 } as any, { id: 'u1' } as User),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
