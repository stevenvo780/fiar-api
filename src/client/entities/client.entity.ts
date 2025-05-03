import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '@/common/entities/sharedProp.helper';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Client extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Identificador único del cliente' })
  id: number;

  @Column()
  @ApiProperty({ description: 'Nombre del cliente' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'cliente@ejemplo.com',
  })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Teléfono de contacto',
    required: false,
    example: '+56912345678',
  })
  phone?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Dirección del cliente', required: false })
  address?: string;

  @ManyToOne(() => User, (user) => user.clients, { nullable: false })
  @JoinColumn()
  @ApiProperty({ description: 'Usuario asociado al cliente', type: () => User })
  user: User;
}
