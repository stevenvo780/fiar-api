import { NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepo: Partial<Repository<Profile>>;
  let userRepo: Partial<Repository<User>>;

  beforeEach(() => {
    profileRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
    userRepo = { findOneBy: jest.fn() } as any;
    service = new ProfileService(profileRepo as any, userRepo as any);
  });

  it('throws when user not found on upsert', async () => {
    (userRepo.findOneBy as jest.Mock).mockResolvedValue(null);
    await expect(service.upsert('1', {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a new profile', async () => {
    (userRepo.findOneBy as jest.Mock).mockResolvedValue({ id: '1' });
    (profileRepo.findOne as jest.Mock).mockResolvedValue(null);
    (profileRepo.create as jest.Mock).mockImplementation((d) => d);
    (profileRepo.save as jest.Mock).mockImplementation(async (p) => p);
    const result = await service.upsert('1', { commerce_name: 'Shop' });
    expect(result.commerce_name).toBe('Shop');
  });
});
