import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import admin from '../utils/firebase-admin.config';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

jest.mock('../utils/firebase-admin.config', () => ({
  __esModule: true,
  default: { auth: jest.fn() },
}));

describe('AuthService', () => {
  let service: AuthService;
  let repo: Partial<Repository<User>>;

  beforeEach(() => {
    repo = { save: jest.fn() } as any;
    service = new AuthService(repo as Repository<User>);
  });

  it('should register a user', async () => {
    const createUser = jest.fn().mockResolvedValue({
      email: 'test@example.com',
      uid: '1',
    });
    (admin as any).auth.mockReturnValue({ createUser });
    (repo.save as jest.Mock).mockResolvedValue({
      email: 'test@example.com',
      id: '1',
      name: 'Test',
    });

    const dto = { email: 'test@example.com', password: 'pass', name: 'Test' };
    const result = await service.register(dto as any);

    expect(createUser).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual({ email: 'test@example.com', id: '1', name: 'Test' });
  });

  it('should throw conflict on existing email', async () => {
    const createUser = jest
      .fn()
      .mockRejectedValue({ code: 'auth/email-already-exists', message: 'exists' });
    (admin as any).auth.mockReturnValue({ createUser });

    const dto = { email: 'test@example.com', password: 'pass', name: 'Test' };
    await expect(service.register(dto as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
