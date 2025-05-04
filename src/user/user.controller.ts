import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { RequestWithUser } from '../auth/types';
import { UpdateResult } from 'typeorm';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Get users with optional filters and pagination',
  })
  @ApiOkResponse({
    description: 'List of users',
    schema: {
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/User' },
        },
        total: {
          type: 'number',
          description: 'Total number of users matching the filters',
        },
      },
    },
  })
  @Get()
  findAll(@Query() findUsersDto: FindUsersDto) {
    return this.userService.findAll(findUsersDto);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a user by ID (Only Super Admin)' })
  @ApiOkResponse({ description: 'User found', type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiOperation({
    summary: 'Get the authenticated user with profile and subscription',
  })
  @ApiOkResponse({
    description: 'Authenticated user successfully retrieved.',
    type: User,
  })
  @Get('me/data')
  async getMe(@Request() req: RequestWithUser): Promise<User | object> {
    if (req.user) {
      return await this.userService.getUserDetails(req.user.id);
    }
    return {};
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Actualizar datos del usuario autenticado' })
  @ApiOkResponse({
    description: 'Usuario actualizado correctamente',
    type: User,
  })
  @Patch('me')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    console.log('updateProfile req.user:', req.user);
    console.log('updateProfile updateUserDto:', updateUserDto);
    return this.userService.update(req.user.id, updateUserDto);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Update a user's role by ID (Only Super Admin)",
  })
  @ApiOkResponse({
    description: 'User role updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Patch(':id')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<Pick<User, 'role'>>,
  ): Promise<UpdateResult> {
    return this.userService.updateRole(id, updateUserDto.role);
  }
}
