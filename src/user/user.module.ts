import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Subscription } from './entities/subscription.entity';
import { ProfileModule } from '../profile/profile.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription]), ProfileModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
