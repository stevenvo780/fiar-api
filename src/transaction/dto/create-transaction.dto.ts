import { IsString, IsNumber, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del cliente asociado', example: 'c0a8012e-1d93-11ee-be56-0242ac120002' })
  clientId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Monto de la transacción', example: 100000.00 })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Estado inicial de la transacción', example: 'pending' })
  status: string;

  @IsOptional()
  @ApiProperty({ description: 'Detalles adicionales de la transacción', example: '{ "nota": "Compra a crédito" }' })
  detail?: Record<string, any>;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Hash de la transacción en blockchain', example: '0xabc123hash', required: false })
  txn_hash?: string;
  
}
