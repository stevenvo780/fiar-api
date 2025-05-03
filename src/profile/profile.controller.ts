import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { RequestWithUser } from '../auth/types';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Crear un nuevo perfil de usuario' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiCreatedResponse({ type: Profile })
  @Post(':userId')
  create(
    @Param('userId') userId: string,
    @Body() dto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profileService.create(+userId, dto);
  }

  @ApiOperation({ summary: 'Obtener un perfil por ID' })
  @ApiOkResponse({ type: Profile })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Profile> {
    return this.profileService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar un perfil por ID' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ type: Profile })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profileService.update(+id, dto);
  }

  @ApiOperation({ summary: 'Crear o actualizar un perfil por ID de usuario' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.CUSTOMER)
  @ApiCreatedResponse({ type: Profile })
  @Put()
  upsert(
    @Body() dto: CreateProfileDto,
    @Request() req: RequestWithUser,
  ): Promise<Profile> {
    const userId = req.user.id;
    return this.profileService.upsert(userId, dto);
  }

  @Get('get/my')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario logueado' })
  @ApiOkResponse({ description: 'Perfil del usuario' })
  async getMyProfile(@Request() req: RequestWithUser) {
    return this.profileService.findProfileByUser(req.user.id);
  }
}
