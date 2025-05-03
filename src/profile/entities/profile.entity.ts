import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export interface ShippingAddress {
  address: string;
  apartment?: string;
  buildingName?: string;
  city: string;
  department: string;
  country: string;
  reference?: string;
}

@Entity('profile')
export class Profile {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Unique identifier for the profile',
    example: 1,
  })
  id: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column('json', { nullable: true })
  @ApiProperty({
    description: 'Detailed shipping address information',
    example: {
      address: 'Calle Principal 123',
      apartment: '4B',
      buildingName: 'Edificio Central',
      city: 'Lima',
      department: 'Lima',
      country: 'Perú',
      reference: 'Cerca al parque principal',
    },
  })
  shippingAddress?: ShippingAddress;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Additional phone number for the profile',
    example: '+1234567890',
    nullable: true,
  })
  additionalPhone?: string;
}
