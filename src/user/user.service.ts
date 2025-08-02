import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { Subscription, PlanType } from './entities/subscription.entity';
import { PaymentSource } from 'src/wompi/entities/payment-source.entity';
import { Profile } from 'src/profile/entities/profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const user = await this.userRepository.save(createUserDto);
    const subscription = new Subscription();
    subscription.user = user;
    subscription.planType = PlanType.FREE;
    subscription.startDate = new Date();
    user.subscription = subscription;
    await this.userRepository.save(user);
    return user;
  }

  async confirmSubscription(
    planType: any,
    customerId: string,
    paymentSource: PaymentSource,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({
      where: { id: customerId },
      relations: ['subscription'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const subscriptionPlanType = planType as PlanType;

    if (user.subscription) {
      user.subscription.planType = subscriptionPlanType;
      user.subscription.startDate = new Date();
      user.subscription.lastPaymentSource = paymentSource;
    } else {
      const subscription = new Subscription();
      subscription.user = user;
      subscription.planType = subscriptionPlanType;
      subscription.startDate = new Date();
      subscription.lastPaymentSource = paymentSource;
      user.subscription = subscription;
    }

    if (user.role === UserRole.CUSTOMER) {
      user.role = UserRole.BUSINESS_OWNER;
    }

    const saveUser = await this.userRepository.save(user);
    return saveUser.subscription;
  }

  async findAll(
    findUsersDto?: FindUsersDto,
  ): Promise<{ users: User[]; total: number }> {
    if (!findUsersDto) {
      const users = await this.userRepository.find();
      return { users, total: users.length };
    }

    const {
      limit = 10,
      offset = 0,
      search,
      minPoints,
      maxPoints,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = findUsersDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (minPoints !== undefined) {
      queryBuilder.andWhere('user.points >= :minPoints', { minPoints });
    }

    if (maxPoints !== undefined) {
      queryBuilder.andWhere('user.points <= :maxPoints', { maxPoints });
    }

    const [users, total] = await queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  updateRole(id: string, role: User['role']): Promise<UpdateResult> {
    return this.userRepository.update(id, { role });
  }

  async getUserDetails(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'subscription'],
    });
    if (user && !user.subscription && user.role === UserRole.BUSINESS_OWNER) {
      const subscription = new Subscription();
      subscription.user = user;
      subscription.planType = PlanType.FREE;
      subscription.startDate = new Date();
      user.subscription = subscription;
      await this.userRepository.save(user);
    }
    if (user?.subscription) {
      delete user.subscription.user;
    }
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    if ((updateData as any).plugins) {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['profile'],
      });
      if (!user.profile) {
        const profile = new Profile();
        profile.user = user;
        profile.plugins = (updateData as any).plugins;
        user.profile = profile;
      }

      if (user && user.profile) {
        user.profile.plugins = (updateData as any).plugins;
        await this.userRepository.manager.save(user.profile);
      }
      delete (updateData as any).plugins;
    }
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async cancelUserSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });
    if (subscription) {
      subscription.planType = PlanType.FREE;
      subscription.endDate = subscription.endDate || new Date();
      await this.subscriptionRepository.save(subscription);
    }
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscription'],
    });
    if (user) {
      return user.subscription;
    }
    throw new NotFoundException('Error al cancelar la suscripción del usuario');
  }
}
