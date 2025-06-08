import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateClientDto } from '../../client/dto/create-client.dto';

export class UpdateTransactionDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'ID del cliente asociado',
    example: 'c0a8012e-1d93-11ee-be56-0242ac120002',
    required: false,
  })
  clientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClientDto)
  @ApiProperty({
    description: 'Datos del cliente a buscar o crear',
    type: CreateClientDto,
    required: false,
  })
  clientData?: CreateClientDto;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Monto de la transacción',
    example: 100000.0,
    required: false,
  })
  amount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Estado de la transacción',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
    required: false,
  })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Tipo de operación de la transacción',
    example: 'expense',
    enum: ['income', 'expense'],
    required: false,
  })
  operation?: 'income' | 'expense';

  @IsOptional()
  @ApiProperty({
    description: 'Detalles adicionales de la transacción',
    example: '{ "nota": "Compra a crédito" }',
    required: false,
  })
  detail?: Record<string, any>;
}
