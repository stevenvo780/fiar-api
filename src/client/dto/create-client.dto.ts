import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @IsString()
  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Perez' })
  name: string;

  @IsEmail()
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'cliente@ejemplo.com',
  })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Teléfono de contacto',
    required: false,
    example: '+56912345678',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dirección del cliente',
    required: false,
    example: 'Av. Siempre Viva 123',
  })
  address?: string;
}
