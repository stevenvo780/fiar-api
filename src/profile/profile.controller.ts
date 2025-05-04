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

  @ApiOperation({ summary: 'Crear o actualizar un perfil de usuario' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiCreatedResponse({ type: Profile })
  @Post()
  upsert(
    @Request() req: RequestWithUser,
    @Body() dto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profileService.upsert(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Obtener un perfil por ID' })
  @ApiOkResponse({ type: Profile })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Profile> {
    return this.profileService.findOne(+id);
  }



  @ApiOperation({ summary: 'Crear o actualizar un perfil por ID de usuario' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.CUSTOMER)
  @ApiCreatedResponse({ type: Profile })
  @Put()
  upsertPut(
    @Body() dto: CreateProfileDto,
    @Request() req: RequestWithUser,
  ): Promise<Profile> {
    const userId = req.user.id;
    return this.profileService.upsert(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiOkResponse({ type: Profile })
  @UseGuards(FirebaseAuthGuard)
  @Get()
  getMyProfile(@Request() req: RequestWithUser) {
    return this.profileService.findProfileByUser(req.user.id);
  }
}
