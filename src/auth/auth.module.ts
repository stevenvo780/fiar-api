import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { ApiKeyAuthGuard } from './api-key-auth.guard';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([User])],
  providers: [AuthService, ApiKeyAuthGuard],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {}
