import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '@/common/entities/sharedProp.helper';
import { User } from '../../user/entities/user.entity';

@Entity()
@Index('UQ_client_document_owner', ['document', 'user'], { unique: true })
export class Client extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Identificador único del cliente', example: 1 })
  id: number;

  @ManyToOne(() => User, (user) => user.clients, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  @ApiProperty({
    description: 'Usuario que creó o administra este cliente',
    type: () => User,
  })
  user: User;

  @Column({ nullable: false })
  @ApiProperty({
    description: 'Documento de identificación del cliente',
    example: '1234567890',
  })
  document: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Apellido del cliente', example: 'González' })
  lastname?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Nombre del cliente', example: 'Carlos' })
  name?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Límite de crédito disponible',
    example: 100000.0,
  })
  credit_limit: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Saldo disponible actual del cliente',
    example: 50000.0,
  })
  current_balance: number;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Indica si el cliente es de confianza',
    example: true,
  })
  trusted: boolean;

  @Column({ type: 'boolean', nullable: true })
  @ApiProperty({
    description: 'Indica si el cliente está bloqueado',
    required: false,
  })
  blocked?: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Ciudad del cliente', example: 'Medellín' })
  city?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Departamento o estado del cliente',
    example: 'Antioquia',
  })
  state?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Cra 15A #10B-240',
  })
  direction?: string;

  @Column({ nullable: true, type: 'numeric' })
  @ApiProperty({ description: 'Teléfono de contacto', example: '3137898941' })
  phone?: number;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'correo@correo.com',
  })
  email?: string;
}
