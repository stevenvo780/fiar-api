import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateClientDto } from '../../client/dto/create-client.dto';

export class CreateTransactionDto {
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

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'Monto de la transacción', example: 100000.0 })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Estado inicial de la transacción',
    example: 'pending',
  })
  status: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipo de operación de la transacción',
    example: 'expense',
    enum: ['income', 'expense'],
  })
  operation: 'income' | 'expense';

  @IsOptional()
  @ApiProperty({
    description: 'Detalles adicionales de la transacción',
    example: '{ "nota": "Compra a crédito" }',
  })
  detail?: Record<string, any>;
}
