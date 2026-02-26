import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Documento de identificación del cliente',
    example: '1234567890',
  })
  document: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Apellido del cliente', example: 'González' })
  lastname?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nombre del cliente', example: 'Carlos' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Límite de crédito disponible',
    example: 100000.0,
  })
  credit_limit?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description:
      'Saldo inicial del cliente (por defecto será igual al límite de crédito)',
    example: 100000.0,
  })
  current_balance?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el cliente es de confianza',
    example: true,
  })
  trusted?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indica si el cliente está bloqueado',
    example: false,
  })
  blocked?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Ciudad del cliente', example: 'Medellín' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Departamento o estado del cliente',
    example: 'Antioquia',
  })
  state?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Cra 15A #10B-240',
  })
  direction?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Teléfono de contacto', example: '3137898941' })
  phone?: string;
}
