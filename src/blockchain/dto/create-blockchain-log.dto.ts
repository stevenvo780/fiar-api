import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlockchainLogDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Entidad asociada al registro',
    example: 'transaction',
  })
  entity: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID de la entidad asociada', example: 'uuid' })
  entityId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Hash de la transacción en blockchain',
    example: '0x123...',
  })
  txnHash: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Dirección del contrato asociado',
    example: '0xabc...',
  })
  contractAddress: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Red de blockchain utilizada',
    example: 'Avalanche',
  })
  network: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Número de bloque en blockchain',
    example: 123456,
  })
  blockNumber: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firma de la transacción', example: 'signature' })
  signature: string;

  @IsOptional()
  @ApiProperty({
    description: 'Prueba adicional en formato JSON',
    example: '{}',
  })
  proof?: Record<string, any>;
}
