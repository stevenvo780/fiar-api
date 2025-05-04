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
  Query,
  DefaultValuePipe,
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
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';
import { Client } from './entities/client.entity';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

class PaginatedClientsResponse extends PaginatedResponseDto<Client> {
  @ApiProperty({ type: [Client] })
  data: Client[];
}

@ApiTags('clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary:
      'Obtener todos los clientes del usuario autenticado con paginación',
  })
  @ApiOkResponse({ type: PaginatedClientsResponse })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de elementos por página (por defecto 10)',
  })
  @ApiQuery({
    name: 'blocked',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado bloqueado',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Filtrar por ciudad',
  })
  @ApiQuery({
    name: 'document',
    required: false,
    type: String,
    description: 'Filtrar por documento',
  })
  @UseGuards(FirebaseAuthGuard)
  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('blocked') blocked?: boolean,
    @Query('city') city?: string,
    @Query('document') document?: string,
  ): Promise<PaginatedResponseDto<Client>> {
    limit = limit > 100 ? 100 : limit;
    return this.clientService.findAll(req.user.id, {
      page,
      limit,
      blocked,
      city,
      document,
    });
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
  ): Promise<Client> {
    return this.clientService.findOne(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Crear un nuevo cliente',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.CUSTOMER)
  @ApiCreatedResponse({ type: Client })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createClientDto: CreateClientDto,
  ): Promise<Client> {
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
  ): Promise<Client> {
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
