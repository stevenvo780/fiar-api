import {
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  @ApiProperty({ example: 'Calle Principal 123' })
  address: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '4B', required: false })
  apartment?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Edificio Central', required: false })
  buildingName?: string;

  @IsString()
  @ApiProperty({ example: 'Lima' })
  city: string;

  @IsString()
  @ApiProperty({ example: 'Lima' })
  department: string;

  @IsString()
  @ApiProperty({ example: 'Perú' })
  country: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Cerca al parque principal', required: false })
  reference?: string;
}

export class CreateProfileDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @ApiProperty({ type: ShippingAddressDto })
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Additional phone number for the user',
    example: '+1234567890',
  })
  additionalPhone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nombre del comercio asociado al perfil',
    example: 'Distribuciones El Trece',
    required: false,
  })
  commerce_name?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Plugin configurations (enabled flag + API key)',
    example: {
      sinergia: { enabled: false, apiKey: '' },
    },
    required: false,
  })
  plugins?: Record<string, { enabled: boolean; apiKey: string }>;
}
