import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: number, dto: CreateProfileDto): Promise<Profile> {
    const user = await this.userRepository.findOneBy({ id: userId.toString() });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = this.profileRepository.create({
      ...dto,
      user,
    });
    return this.profileRepository.save(profile);
  }

  async findOne(id: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async update(id: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id);
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }

  async upsert(userId: string, dto: CreateProfileDto): Promise<Profile> {
    const user = await this.userRepository.findOneBy({ id: userId.toString() });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (profile) {
      Object.assign(profile, dto);
    } else {
      profile = this.profileRepository.create({
        ...dto,
        user,
      });
    }
    return this.profileRepository.save(profile);
  }

  async findProfileByUser(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) {
      const newProfile = this.profileRepository.create({
        user: { id: userId },
      });
      return this.profileRepository.save(newProfile);
    }
    return profile;
  }
}
