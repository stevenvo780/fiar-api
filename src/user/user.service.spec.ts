import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Subscription, PlanType } from './entities/subscription.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepo: Partial<Repository<User>>;
  let subRepo: Partial<Repository<Subscription>>;

  beforeEach(() => {
    userRepo = { save: jest.fn(), findOne: jest.fn(), update: jest.fn() } as any;
    subRepo = { findOne: jest.fn(), save: jest.fn() } as any;
    service = new UserService(userRepo as any, subRepo as any);
  });

  it('creates user with subscription', async () => {
    (userRepo.save as jest.Mock)
      .mockResolvedValueOnce({ id: '1' })
      .mockResolvedValueOnce({ id: '1', subscription: { planType: PlanType.FREE } });
    const result = await service.create({ email: 'a' });
    expect(result.subscription).toBeDefined();
    expect(userRepo.save).toHaveBeenCalledTimes(2);
  });

  it('getUserDetails creates default subscription', async () => {
    const user = { id: '1', role: UserRole.BUSINESS_OWNER } as User;
    (userRepo.findOne as jest.Mock).mockResolvedValue(user);
    (userRepo.save as jest.Mock).mockImplementation((u) => Promise.resolve(u));
    const result = await service.getUserDetails('1');
    expect(result?.subscription).toBeDefined();
    expect(userRepo.save).toHaveBeenCalled();
  });

  it('getUserDetails returns null when not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const result = await service.getUserDetails('1');
    expect(result).toBeNull();
  });
});
