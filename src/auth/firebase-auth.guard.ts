import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import admin from '../utils/firebase-admin.config';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        const newUser = new User();
        newUser.id = decodedToken.uid;
        newUser.email = decodedToken.email;
        newUser.name = decodedToken.name;
        newUser.role = UserRole.SUPER_ADMIN; // Default role for new users
        const responseUser = await this.userRepository.save(newUser);
        request['user'] = responseUser;
      }

      request['user'] = user;
      request['token'] = decodedToken;
      console.log('Decoded token:', decodedToken);
      return true;
    } catch (error) {
      if (error.code) {
        switch (error.code) {
          case 'auth/id-token-expired':
            throw new UnauthorizedException('Token has expired');
          case 'auth/invalid-id-token':
            throw new UnauthorizedException('Invalid token');
          case 'auth/argument-error':
            throw new UnauthorizedException('Token argument error');
          case 'auth/user-disabled':
            throw new ForbiddenException('User account is disabled');
          case 'auth/user-not-found':
            throw new UnauthorizedException('User not found');
          case 'auth/requires-recent-login':
            throw new UnauthorizedException('Recent login required');
          case 'auth/invalid-credential':
            throw new UnauthorizedException('Invalid credential');
          default:
            console.error(
              'Unhandled Firebase error code:',
              error.code,
              error.message,
            );
            throw new InternalServerErrorException(
              'Unexpected authentication error',
            );
        }
      } else {
        console.error(
          'Unexpected error during Firebase token verification:',
          error,
        );
        throw new InternalServerErrorException(
          'Unexpected authentication error',
        );
      }
    }
  }
}
