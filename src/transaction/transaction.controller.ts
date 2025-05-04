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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
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
  ApiHeader,
} from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

class PaginatedTransactionsResponse {
  @ApiProperty({ type: [Transaction] })
  data: Transaction[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;

  @ApiProperty()
  last_page: number;
}

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({
    summary:
      'Obtener todas las transacciones del usuario autenticado con paginación',
  })
  @ApiOkResponse({ type: PaginatedTransactionsResponse })
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
    description: 'Elementos por página (por defecto 10)',
  })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'clientSearch', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Filtrar por estado de la transacción (pending, approved, rejected)',
  })
  @UseGuards(FirebaseAuthGuard)
  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('clientSearch') clientSearch?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('status') status?: string,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.transactionService.findAll(req.user.id, {
      minAmount,
      maxAmount,
      clientSearch,
      startDate,
      endDate,
      order,
      page,
      limit,
      status,
    });
  }

  @ApiOperation({
    summary: 'Obtener una transacción por ID',
  })
  @ApiOkResponse({ type: Transaction })
  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.transactionService.findOne(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Crear una nueva transacción',
  })
  @ApiHeader({
    name: 'X-API-KEY',
    description: 'Clave del servicio consumidor (server-to-server)',
    required: true,
  })
  @UseGuards(ApiKeyAuthGuard)
  @ApiCreatedResponse({ type: Transaction })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(createTransactionDto, req.user);
  }

  @ApiOperation({
    summary: 'Actualizar una transacción por ID',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ type: Transaction })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto, req.user);
  }

  @ApiOperation({
    summary: 'Eliminar una transacción por ID',
  })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ description: 'Transacción eliminada correctamente' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.transactionService.remove(id, req.user);
  }
}
