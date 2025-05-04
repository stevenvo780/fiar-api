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
} from '@nestjs/swagger';
import { Transaction } from './entities/transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({
    summary: 'Obtener todas las transacciones del usuario autenticado',
  })
  @ApiOkResponse({ type: [Transaction] })
  @UseGuards(FirebaseAuthGuard)

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('clientSearch') clientSearch?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('order') order: 'asc' | 'desc' = 'desc',  // Filtro de orden por monto
  ) {
    return this.transactionService.findAll(req.user.id, {
      minAmount,
      maxAmount,
      clientSearch,
      startDate,
      endDate,
      order,
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
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
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
