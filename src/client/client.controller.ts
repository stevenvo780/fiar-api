import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Client } from './entities/client.entity';

@ApiTags('clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary: 'Obtener todos los clientes del usuario autenticado',
  })
  @ApiOkResponse({ type: [Client] })
  @UseGuards(FirebaseAuthGuard)
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.clientService.findAll(req.user.id);
  }

  @ApiOperation({
    summary: 'Obtener un cliente por ID',
  })
  @ApiOkResponse({ type: Client })
  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.clientService.findOne(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Crear un nuevo cliente',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiCreatedResponse({ type: Client })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientService.create(createClientDto, req.user);
  }

  @ApiOperation({
    summary: 'Actualizar un cliente por ID',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ type: Client })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(id, updateClientDto, req.user);
  }

  @ApiOperation({
    summary: 'Eliminar un cliente por ID',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ description: 'Cliente eliminado correctamente' })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.clientService.remove(id, req.user);
  }
}
