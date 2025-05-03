import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123',
  })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User name (optional)',
    example: 'John Doe',
    nullable: true,
  })
  name?: string;
}
