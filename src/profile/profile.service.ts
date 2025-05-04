import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<Profile> {
    return this.profileRepository.findOne({ where: { id: +id } }); // conversión a número
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
      if (dto.commerce_name === undefined) {
        profile.commerce_name = profile.commerce_name ?? '';
      } else {
        profile.commerce_name = dto.commerce_name;
      }
    } else {
      profile = this.profileRepository.create({
        ...dto,
        user,
        commerce_name: dto.commerce_name ?? '',
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
        commerce_name: '', // Valor por defecto para evitar error de not null
      });
      return this.profileRepository.save(newProfile);
    }
    return profile;
  }
}
